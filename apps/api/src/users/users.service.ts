import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

export interface PaginatedUsers {
  data: User[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    throw new ConflictException(
      'Use POST /auth/register to create accounts with passwords',
    );
  }

  async createWithPassword(input: {
    email: string;
    displayName: string;
    username: string;
    passwordHash: string;
  }): Promise<User> {
    const user = this.usersRepository.create({
      email: input.email.trim().toLowerCase(),
      displayName: input.displayName.trim(),
      username: input.username.trim().toLowerCase(),
      passwordHash: input.passwordHash,
      oauthProvider: null,
      oauthSubject: null,
    });

    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      this.throwIfDuplicate(error);
      throw error;
    }
  }

  async createWithOAuth(input: {
    email: string;
    displayName: string;
    username: string;
    oauthProvider: string;
    oauthSubject: string;
    emailVerified?: boolean;
  }): Promise<User> {
    const user = this.usersRepository.create({
      email: input.email.trim().toLowerCase(),
      displayName: input.displayName.trim(),
      username: input.username.trim().toLowerCase(),
      passwordHash: null,
      oauthProvider: input.oauthProvider,
      oauthSubject: input.oauthSubject,
      emailVerified: input.emailVerified ?? true,
    });

    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      this.throwIfDuplicate(error);
      throw error;
    }
  }

  async findByOAuth(
    provider: string,
    subject: string,
  ): Promise<User | null> {
    return this.usersRepository.findOneBy({
      oauthProvider: provider,
      oauthSubject: subject,
    });
  }

  async usernameExists(username: string): Promise<boolean> {
    const count = await this.usersRepository.countBy({
      username: username.trim().toLowerCase(),
    });
    return count > 0;
  }

  async updateEmail(id: string, email: string): Promise<User> {
    try {
      await this.usersRepository.update(
        { id },
        { email: email.trim().toLowerCase(), emailVerified: false },
      );
      return this.findOne(id);
    } catch (error) {
      this.throwIfDuplicate(error);
      throw error;
    }
  }

  async findAll(query: ListUsersQueryDto): Promise<PaginatedUsers> {
    const { page, limit } = query;
    const [data, total] = await this.usersRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      select: [
        'id',
        'email',
        'displayName',
        'username',
        'role',
        'status',
        'emailVerified',
        'oauthProvider',
        'createdAt',
        'updatedAt',
      ],
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'displayName',
        'username',
        'role',
        'status',
        'emailVerified',
        'oauthProvider',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User ${id} was not found`);
    }

    return user;
  }

  async findOneWithPassword(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User ${id} was not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({
      email: email.trim().toLowerCase(),
    });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.usersRepository.update({ id }, { passwordHash });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.preload({
      id,
      ...updateUserDto,
      ...(updateUserDto.email && {
        email: updateUserDto.email.trim().toLowerCase(),
      }),
      ...(updateUserDto.displayName && {
        displayName: updateUserDto.displayName.trim(),
      }),
      ...(updateUserDto.username && {
        username: updateUserDto.username.trim().toLowerCase(),
      }),
    });

    if (!user) {
      throw new NotFoundException(`User ${id} was not found`);
    }

    try {
      const saved = await this.usersRepository.save(user);
      return this.findOne(saved.id);
    } catch (error) {
      this.throwIfDuplicate(error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOneWithPassword(id);
    await this.usersRepository.remove(user);
  }

  private throwIfDuplicate(error: unknown): void {
    if (
      error instanceof QueryFailedError &&
      (error.driverError as { code?: string }).code === '23505'
    ) {
      throw new ConflictException('Email or username is already in use');
    }
  }
}
