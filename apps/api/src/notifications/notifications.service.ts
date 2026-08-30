import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
  ) {}

  create(input: {
    userId: string;
    type: string;
    title: string;
    body: string;
    link?: string | null;
  }): Promise<Notification> {
    return this.notificationsRepository.save(
      this.notificationsRepository.create({
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link ?? null,
        readAt: null,
      }),
    );
  }

  findMine(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationsRepository.count({
      where: { userId, readAt: IsNull() },
    });
    return { count };
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOneBy({
      id,
      userId,
    });
    if (!notification) {
      throw new NotFoundException(`Notification ${id} was not found`);
    }
    if (!notification.readAt) {
      notification.readAt = new Date();
      await this.notificationsRepository.save(notification);
    }
    return notification;
  }

  async markAllRead(userId: string): Promise<{ message: string }> {
    await this.notificationsRepository.update(
      { userId, readAt: IsNull() },
      { readAt: new Date() },
    );
    return { message: 'All notifications marked as read' };
  }
}
