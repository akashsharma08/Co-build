import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const repository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    preload: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };
  const service = new UsersService(repository as unknown as Repository<User>);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes identity fields when creating with a password', async () => {
    const user = {
      id: 'user-id',
      email: 'alex@example.com',
      displayName: 'Alex Morgan',
      username: 'alex_morgan',
      passwordHash: 'hash',
    } as User;
    repository.create.mockReturnValue(user);
    repository.save.mockResolvedValue(user);

    await expect(
      service.createWithPassword({
        email: ' Alex@Example.com ',
        displayName: ' Alex Morgan ',
        username: 'Alex_Morgan',
        passwordHash: 'hash',
      }),
    ).resolves.toBe(user);

    expect(repository.create).toHaveBeenCalledWith({
      email: 'alex@example.com',
      displayName: 'Alex Morgan',
      username: 'alex_morgan',
      passwordHash: 'hash',
    });
  });

  it('throws when a user does not exist', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
