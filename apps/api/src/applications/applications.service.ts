import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { ProjectMemberRole } from '../members/entities/project-member.entity';
import { MembersService } from '../members/members.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ProjectStatus } from '../projects/entities/project.entity';
import { ProjectsService } from '../projects/projects.service';
import {
  CreateApplicationDto,
  ReviewApplicationDto,
} from './dto/application.dto';
import { Application, ApplicationStatus } from './entities/application.entity';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationsRepository: Repository<Application>,
    private readonly projectsService: ProjectsService,
    private readonly membersService: MembersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async apply(
    projectId: string,
    applicantId: string,
    dto: CreateApplicationDto,
  ): Promise<Application> {
    const project = await this.projectsService.findOne(projectId);
    if (project.ownerId === applicantId) {
      throw new BadRequestException('You cannot apply to your own project');
    }
    if (project.status !== ProjectStatus.OPEN) {
      throw new BadRequestException(
        'This project is not accepting applications',
      );
    }

    const application = this.applicationsRepository.create({
      projectId,
      applicantId,
      introduction: dto.introduction,
      skills: dto.skills,
      availability: dto.availability,
      portfolioLinks: dto.portfolioLinks ?? [],
      status: ApplicationStatus.PENDING,
    });

    try {
      const saved = await this.applicationsRepository.save(application);
      await this.notificationsService.create({
        userId: project.ownerId,
        type: 'application_received',
        title: 'New project application',
        body: `Someone applied to join ${project.name}.`,
        link: `/projects/${project.id}`,
      });
      return this.findOne(saved.id);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('You already applied to this project');
      }
      throw error;
    }
  }

  async findMine(applicantId: string): Promise<Application[]> {
    const applications = await this.applicationsRepository.find({
      where: { applicantId },
      relations: { project: true, applicant: true },
      order: { createdAt: 'DESC' },
    });
    return applications.map((application) => this.sanitize(application));
  }

  async findForProject(
    projectId: string,
    ownerId: string,
  ): Promise<Application[]> {
    const project = await this.projectsService.findOne(projectId);
    if (project.ownerId !== ownerId) {
      throw new ForbiddenException(
        'Only the project owner can review applications',
      );
    }
    const applications = await this.applicationsRepository.find({
      where: { projectId },
      relations: { applicant: true, project: true },
      order: { createdAt: 'DESC' },
    });
    return applications.map((application) => this.sanitize(application));
  }

  async review(
    applicationId: string,
    ownerId: string,
    dto: ReviewApplicationDto,
  ): Promise<Application> {
    const application = await this.findOne(applicationId);
    if (application.project.ownerId !== ownerId) {
      throw new ForbiddenException(
        'Only the project owner can review applications',
      );
    }

    const previousStatus = application.status;
    application.status = dto.status;
    await this.applicationsRepository.save(application);

    if (dto.status === ApplicationStatus.ACCEPTED) {
      await this.membersService.ensureMember(
        application.projectId,
        application.applicantId,
        ProjectMemberRole.MEMBER,
      );
    } else if (previousStatus === ApplicationStatus.ACCEPTED) {
      await this.membersService.removeMember(
        application.projectId,
        application.applicantId,
      );
    }

    const statusLabel = dto.status.replace('_', ' ');
    await this.notificationsService.create({
      userId: application.applicantId,
      type: 'application_reviewed',
      title: `Application ${statusLabel}`,
      body: `Your application to ${application.project.name} was ${statusLabel}.`,
      link: `/projects/${application.projectId}`,
    });

    return this.findOne(applicationId);
  }

  async findOne(id: string): Promise<Application> {
    const application = await this.applicationsRepository.findOne({
      where: { id },
      relations: { applicant: true, project: true },
    });
    if (!application) {
      throw new NotFoundException(`Application ${id} was not found`);
    }
    return this.sanitize(application);
  }

  private sanitize(application: Application): Application {
    if (application.applicant) {
      delete (application.applicant as { passwordHash?: string | null })
        .passwordHash;
    }
    return application;
  }
}
