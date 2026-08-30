import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { IsNull, LessThan, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import type { User } from '../users/entities/user.entity';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshToken } from './entities/refresh-token.entity';

export type PublicUser = Omit<User, 'passwordHash' | 'oauthSubject'> & {
  hasPassword: boolean;
};

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  tokenType: 'Bearer';
  user: PublicUser;
}

export interface SessionMeta {
  userAgent?: string | null;
  ipAddress?: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
  ) {}

  async register(
    dto: RegisterDto,
    meta: SessionMeta = {},
  ): Promise<AuthResponse> {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createWithPassword({
      email: dto.email,
      displayName: dto.displayName,
      username: dto.username,
      passwordHash,
    });
    return this.issueSession(user, meta);
  }

  async login(dto: LoginDto, meta: SessionMeta = {}): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueSession(user, meta);
  }

  async refresh(
    refreshToken: string,
    meta: SessionMeta = {},
  ): Promise<AuthResponse> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.refreshTokensRepository.findOne({
      where: { tokenHash, revokedAt: IsNull() },
      relations: { user: true },
    });

    if (!stored || stored.expiresAt.getTime() <= Date.now()) {
      if (stored) {
        stored.revokedAt = new Date();
        await this.refreshTokensRepository.save(stored);
      }
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const user = stored.user;
    const next = await this.createRefreshToken(user.id, meta);

    stored.revokedAt = new Date();
    stored.replacedByTokenHash = next.tokenHash;
    await this.refreshTokensRepository.save(stored);

    return {
      accessToken: this.signAccessToken(user),
      refreshToken: next.rawToken,
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
      tokenType: 'Bearer',
      user: this.toPublicUser(user),
    };
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.refreshTokensRepository.findOneBy({ tokenHash });
    if (stored && !stored.revokedAt) {
      stored.revokedAt = new Date();
      await this.refreshTokensRepository.save(stored);
    }
    return { message: 'Logged out' };
  }

  async logoutAll(userId: string): Promise<{ message: string }> {
    await this.refreshTokensRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    return { message: 'Logged out from all sessions' };
  }

  toPublicUser(user: User): PublicUser {
    const {
      passwordHash,
      oauthSubject: _oauthSubject,
      ...publicUser
    } = user;
    return {
      ...publicUser,
      hasPassword: Boolean(passwordHash),
    };
  }

  async getMe(userId: string): Promise<PublicUser> {
    const user = await this.usersService.findOneWithPassword(userId);
    return this.toPublicUser(user);
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findOneWithPassword(userId);
    if (!user.passwordHash) {
      throw new BadRequestException(
        'This account uses social login. Set a password is not available yet.',
      );
    }
    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new ConflictException('New password must be different');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(userId, passwordHash);
    await this.logoutAll(userId);
    return { message: 'Password updated. Please sign in again.' };
  }

  async changeEmail(
    userId: string,
    dto: ChangeEmailDto,
  ): Promise<{ message: string; user: PublicUser }> {
    const user = await this.usersService.findOneWithPassword(userId);
    if (!user.passwordHash) {
      throw new BadRequestException(
        'Confirm your identity with a password is required to change email',
      );
    }
    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const nextEmail = dto.email.trim().toLowerCase();
    if (nextEmail === user.email) {
      throw new ConflictException('Email is already set to this value');
    }

    const updated = await this.usersService.updateEmail(userId, nextEmail);
    const full = await this.usersService.findOneWithPassword(updated.id);
    return {
      message: 'Email updated',
      user: this.toPublicUser(full),
    };
  }

  async deleteAccount(
    userId: string,
    dto: DeleteAccountDto,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findOneWithPassword(userId);
    if (user.passwordHash) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Current password is required');
      }
      const valid = await bcrypt.compare(
        dto.currentPassword,
        user.passwordHash,
      );
      if (!valid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }
    await this.logoutAll(userId);
    await this.usersService.remove(userId);
    return { message: 'Account deleted' };
  }

  getOAuthProviders(): { google: boolean; github: boolean } {
    return {
      google: Boolean(
        this.config.get<string>('GOOGLE_CLIENT_ID') &&
          this.config.get<string>('GOOGLE_CLIENT_SECRET'),
      ),
      github: Boolean(
        this.config.get<string>('GITHUB_CLIENT_ID') &&
          this.config.get<string>('GITHUB_CLIENT_SECRET'),
      ),
    };
  }

  getGoogleAuthUrl(state: string): string {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('Google OAuth is not configured');
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: this.oauthCallbackUrl('google'),
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'online',
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  getGithubAuthUrl(state: string): string {
    const clientId = this.config.get<string>('GITHUB_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('GitHub OAuth is not configured');
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: this.oauthCallbackUrl('github'),
      scope: 'read:user user:email',
      state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async handleGoogleCallback(
    code: string,
    meta: SessionMeta = {},
  ): Promise<AuthResponse> {
    const clientId = this.config.getOrThrow<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.getOrThrow<string>('GOOGLE_CLIENT_SECRET');
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: this.oauthCallbackUrl('google'),
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) {
      throw new UnauthorizedException('Google authentication failed');
    }
    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      throw new UnauthorizedException('Google authentication failed');
    }

    const profileRes = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
    );
    if (!profileRes.ok) {
      throw new UnauthorizedException('Could not load Google profile');
    }
    const profile = (await profileRes.json()) as {
      id: string;
      email?: string;
      name?: string;
      verified_email?: boolean;
    };
    if (!profile.email) {
      throw new BadRequestException('Google account email is required');
    }

    const user = await this.findOrCreateOAuthUser({
      provider: 'google',
      subject: profile.id,
      email: profile.email,
      displayName: profile.name || profile.email.split('@')[0],
      emailVerified: Boolean(profile.verified_email),
    });
    return this.issueSession(user, meta);
  }

  async handleGithubCallback(
    code: string,
    meta: SessionMeta = {},
  ): Promise<AuthResponse> {
    const clientId = this.config.getOrThrow<string>('GITHUB_CLIENT_ID');
    const clientSecret = this.config.getOrThrow<string>('GITHUB_CLIENT_SECRET');
    const tokenRes = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: this.oauthCallbackUrl('github'),
        }),
      },
    );
    if (!tokenRes.ok) {
      throw new UnauthorizedException('GitHub authentication failed');
    }
    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
    };
    if (!tokenData.access_token) {
      throw new UnauthorizedException('GitHub authentication failed');
    }

    const profileRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'CoBuild',
      },
    });
    if (!profileRes.ok) {
      throw new UnauthorizedException('Could not load GitHub profile');
    }
    const profile = (await profileRes.json()) as {
      id: number;
      login: string;
      name?: string | null;
      email?: string | null;
    };

    let email = profile.email;
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'CoBuild',
        },
      });
      if (emailsRes.ok) {
        const emails = (await emailsRes.json()) as Array<{
          email: string;
          primary: boolean;
          verified: boolean;
        }>;
        email =
          emails.find((item) => item.primary && item.verified)?.email ||
          emails.find((item) => item.verified)?.email ||
          emails[0]?.email;
      }
    }
    if (!email) {
      throw new BadRequestException('GitHub account email is required');
    }

    const user = await this.findOrCreateOAuthUser({
      provider: 'github',
      subject: String(profile.id),
      email,
      displayName: profile.name || profile.login,
      emailVerified: true,
      preferredUsername: profile.login,
    });
    return this.issueSession(user, meta);
  }

  buildWebCallbackUrl(auth: AuthResponse): string {
    const webUrl = this.config.get<string>('WEB_URL', 'http://localhost:3000');
    const params = new URLSearchParams({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
    });
    return `${webUrl}/auth/callback?${params.toString()}`;
  }

  async purgeExpiredTokens(): Promise<void> {
    await this.refreshTokensRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  async issueSession(
    user: User,
    meta: SessionMeta,
  ): Promise<AuthResponse> {
    const refresh = await this.createRefreshToken(user.id, meta);
    return {
      accessToken: this.signAccessToken(user),
      refreshToken: refresh.rawToken,
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
      tokenType: 'Bearer',
      user: this.toPublicUser(user),
    };
  }

  private oauthCallbackUrl(provider: 'google' | 'github'): string {
    const apiPublicUrl = this.config.get<string>(
      'API_PUBLIC_URL',
      'http://localhost:4000',
    );
    return `${apiPublicUrl.replace(/\/$/, '')}/api/v1/auth/${provider}/callback`;
  }

  private async findOrCreateOAuthUser(input: {
    provider: string;
    subject: string;
    email: string;
    displayName: string;
    emailVerified: boolean;
    preferredUsername?: string;
  }): Promise<User> {
    const existingOAuth = await this.usersService.findByOAuth(
      input.provider,
      input.subject,
    );
    if (existingOAuth) {
      return existingOAuth;
    }

    const byEmail = await this.usersService.findByEmail(input.email);
    if (byEmail) {
      throw new ConflictException(
        'An account with this email already exists. Sign in with email/password instead.',
      );
    }

    const username = await this.uniqueUsername(
      input.preferredUsername || input.displayName || input.email.split('@')[0],
    );

    return this.usersService.createWithOAuth({
      email: input.email,
      displayName: input.displayName.slice(0, 100),
      username,
      oauthProvider: input.provider,
      oauthSubject: input.subject,
      emailVerified: input.emailVerified,
    });
  }

  private async uniqueUsername(seed: string): Promise<string> {
    const base = seed
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 20) || 'user';
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const candidate =
        attempt === 0 ? base : `${base}${Math.floor(Math.random() * 10000)}`;
      if (!(await this.usersService.usernameExists(candidate))) {
        return candidate.slice(0, 30);
      }
    }
    return `user${randomBytes(4).toString('hex')}`;
  }

  private signAccessToken(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
  }

  private async createRefreshToken(
    userId: string,
    meta: SessionMeta,
  ): Promise<{ rawToken: string; tokenHash: string }> {
    const rawToken = randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const days = Number(
      this.config.get<string>('REFRESH_TOKEN_DAYS', '30'),
    );
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.refreshTokensRepository.save(
      this.refreshTokensRepository.create({
        userId,
        tokenHash,
        expiresAt,
        revokedAt: null,
        replacedByTokenHash: null,
        userAgent: meta.userAgent ?? null,
        ipAddress: meta.ipAddress ?? null,
      }),
    );

    return { rawToken, tokenHash };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
