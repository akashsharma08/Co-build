import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMemberRole } from '../members/entities/project-member.entity';
import { MembersService } from '../members/members.service';
import {
  CreateProjectDto,
  ListProjectsQueryDto,
  UpdateProjectDto,
} from './dto/project.dto';
import { Project, ProjectStatus } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    private readonly membersService: MembersService,
  ) {}

  async create(ownerId: string, dto: CreateProjectDto): Promise<Project> {
    const project = this.projectsRepository.create({
      ...dto,
      ownerId,
      status: ProjectStatus.OPEN,
    });
    const saved = await this.projectsRepository.save(project);
    await this.membersService.ensureMember(
      saved.id,
      ownerId,
      ProjectMemberRole.OWNER,
    );
    return this.findOne(saved.id);
  }

  async findAll(query: ListProjectsQueryDto) {
    const { page, limit, q, category, goal, stage, skill, role } = query;
    const qb = this.projectsRepository
      .createQueryBuilder('project')
      .leftJoin('project.owner', 'owner')
      .addSelect([
        'owner.id',
        'owner.displayName',
        'owner.username',
        'owner.email',
      ])
      .where('project.status = :status', { status: ProjectStatus.OPEN })
      .orderBy('project.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (q) {
      qb.andWhere(
        '(project.name ILIKE :q OR project.shortDescription ILIKE :q OR project.detailedDescription ILIKE :q)',
        { q: `%${q}%` },
      );
    }
    if (category) {
      qb.andWhere('project.category ILIKE :category', {
        category: `%${category}%`,
      });
    }
    if (goal) {
      qb.andWhere('project.goal = :goal', { goal });
    }
    if (stage) {
      qb.andWhere('project.stage = :stage', { stage });
    }
    if (skill) {
      qb.andWhere('project.skills::text ILIKE :skill', {
        skill: `%${skill}%`,
      });
    }
    if (role) {
      qb.andWhere('project.requiredRoles::text ILIKE :role', {
        role: `%${role}%`,
      });
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  async findMine(ownerId: string): Promise<Project[]> {
    return this.projectsRepository
      .createQueryBuilder('project')
      .leftJoin('project.owner', 'owner')
      .addSelect([
        'owner.id',
        'owner.displayName',
        'owner.username',
        'owner.email',
      ])
      .where('project.ownerId = :ownerId', { ownerId })
      .orderBy('project.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectsRepository
      .createQueryBuilder('project')
      .leftJoin('project.owner', 'owner')
      .addSelect([
        'owner.id',
        'owner.displayName',
        'owner.username',
        'owner.email',
      ])
      .where('project.id = :id', { id })
      .getOne();
    if (!project) {
      throw new NotFoundException(`Project ${id} was not found`);
    }
    return project;
  }

  async update(
    id: string,
    ownerId: string,
    dto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.findOne(id);
    if (project.ownerId !== ownerId) {
      throw new NotFoundException(`Project ${id} was not found`);
    }
    Object.assign(project, dto);
    await this.projectsRepository.save(project);
    return this.findOne(id);
  }

  async archive(id: string, ownerId: string): Promise<Project> {
    return this.update(id, ownerId, { status: ProjectStatus.ARCHIVED });
  }
}
