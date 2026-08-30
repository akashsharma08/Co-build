import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { Repository } from 'typeorm';
import { UpsertProfileDto } from './dto/upsert-profile.dto';
import { Profile } from './entities/profile.entity';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

@Injectable()
export class ProfilesService {
  private readonly uploadsRoot: string;

  constructor(
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
  ) {
    this.uploadsRoot = join(process.cwd(), 'uploads', 'avatars');
  }

  async getMine(userId: string): Promise<Profile> {
    let profile = await this.profilesRepository
      .createQueryBuilder('profile')
      .leftJoin('profile.user', 'user')
      .addSelect(['user.id', 'user.displayName', 'user.username', 'user.email'])
      .where('profile.userId = :userId', { userId })
      .getOne();

    if (!profile) {
      profile = await this.profilesRepository.save(
        this.profilesRepository.create({ userId }),
      );
      return this.getMine(userId);
    }

    return profile;
  }

  async getByUserId(userId: string): Promise<Profile> {
    const profile = await this.profilesRepository
      .createQueryBuilder('profile')
      .leftJoin('profile.user', 'user')
      .addSelect(['user.id', 'user.displayName', 'user.username', 'user.email'])
      .where('profile.userId = :userId', { userId })
      .getOne();
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async upsertMine(userId: string, dto: UpsertProfileDto): Promise<Profile> {
    const existing = await this.profilesRepository.findOneBy({ userId });
    if (!existing) {
      const created = this.profilesRepository.create({ userId, ...dto });
      await this.profilesRepository.save(created);
      return this.getMine(userId);
    }

    Object.assign(existing, dto);
    await this.profilesRepository.save(existing);
    return this.getMine(userId);
  }

  async updateAvatar(
    userId: string,
    file: Express.Multer.File | undefined,
  ): Promise<Profile> {
    if (!file) {
      throw new BadRequestException('Avatar image is required');
    }
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        'Avatar must be a JPEG, PNG, WebP, or GIF image',
      );
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Avatar must be 5MB or smaller');
    }

    const profile = await this.getMine(userId);
    await mkdir(this.uploadsRoot, { recursive: true });

    const ext =
      MIME_TO_EXT[file.mimetype] ??
      (extname(file.originalname).toLowerCase() || '.jpg');
    const hash = createHash('sha1')
      .update(`${userId}-${randomUUID()}`)
      .digest('hex')
      .slice(0, 12);
    const filename = `${userId}-${hash}${ext}`;
    const absolutePath = join(this.uploadsRoot, filename);

    await writeFile(absolutePath, file.buffer);

    const previousPath = profile.avatarUrl
      ? this.toAbsolutePath(profile.avatarUrl)
      : null;

    profile.avatarUrl = `/uploads/avatars/${filename}`;
    await this.profilesRepository.save(profile);

    if (previousPath && previousPath !== absolutePath) {
      await unlink(previousPath).catch(() => undefined);
    }

    return this.getMine(userId);
  }

  async removeAvatar(userId: string): Promise<Profile> {
    const profile = await this.getMine(userId);
    if (!profile.avatarUrl) {
      return profile;
    }

    const absolutePath = this.toAbsolutePath(profile.avatarUrl);
    profile.avatarUrl = null;
    await this.profilesRepository.save(profile);
    await unlink(absolutePath).catch(() => undefined);
    return this.getMine(userId);
  }

  private toAbsolutePath(avatarUrl: string): string {
    const relative = avatarUrl.replace(/^\/uploads\/avatars\//, '');
    return join(this.uploadsRoot, relative);
  }
}
