import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ProjectMember,
  ProjectMemberRole,
} from './entities/project-member.entity';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(ProjectMember)
    private readonly membersRepository: Repository<ProjectMember>,
  ) {}

  async ensureMember(
    projectId: string,
    userId: string,
    role: ProjectMemberRole = ProjectMemberRole.MEMBER,
  ): Promise<ProjectMember> {
    const existing = await this.membersRepository.findOneBy({
      projectId,
      userId,
    });
    if (existing) {
      if (existing.role !== role && role === ProjectMemberRole.OWNER) {
        existing.role = role;
        return this.membersRepository.save(existing);
      }
      return existing;
    }
    return this.membersRepository.save(
      this.membersRepository.create({ projectId, userId, role }),
    );
  }

  async removeMember(projectId: string, userId: string): Promise<void> {
    await this.membersRepository.delete({ projectId, userId });
  }

  async findForProject(projectId: string): Promise<ProjectMember[]> {
    const members = await this.membersRepository.find({
      where: { projectId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });
    return members.map((member) => this.sanitize(member));
  }

  async findMine(userId: string): Promise<ProjectMember[]> {
    const members = await this.membersRepository.find({
      where: { userId },
      relations: { project: true, user: true },
      order: { createdAt: 'DESC' },
    });
    return members.map((member) => this.sanitize(member));
  }

  async findOne(id: string): Promise<ProjectMember> {
    const member = await this.membersRepository.findOne({
      where: { id },
      relations: { user: true, project: true },
    });
    if (!member) {
      throw new NotFoundException(`Member ${id} was not found`);
    }
    return this.sanitize(member);
  }

  private sanitize(member: ProjectMember): ProjectMember {
    if (member.user) {
      delete (member.user as { passwordHash?: string | null }).passwordHash;
    }
    return member;
  }
}
