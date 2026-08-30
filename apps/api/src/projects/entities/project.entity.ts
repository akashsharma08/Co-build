import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import type { Application } from '../../applications/entities/application.entity';

export enum ProjectGoal {
  LEARNING = 'learning',
  PORTFOLIO = 'portfolio',
  STARTUP = 'startup',
  OPEN_SOURCE = 'open_source',
  COMPETITION = 'competition',
}

export enum ProjectStage {
  IDEA = 'idea',
  PLANNING = 'planning',
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  LAUNCHING = 'launching',
}

export enum ProjectStatus {
  OPEN = 'open',
  PAUSED = 'paused',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

@Entity({ name: 'projects' })
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'short_description', type: 'varchar', length: 280 })
  shortDescription!: string;

  @Column({ name: 'detailed_description', type: 'text' })
  detailedDescription!: string;

  @Column({ type: 'varchar', length: 80 })
  category!: string;

  @Column({
    type: 'enum',
    enum: ProjectStage,
    enumName: 'project_stage_enum',
    default: ProjectStage.IDEA,
  })
  stage!: ProjectStage;

  @Column({
    type: 'enum',
    enum: ProjectGoal,
    enumName: 'project_goal_enum',
    default: ProjectGoal.LEARNING,
  })
  goal!: ProjectGoal;

  @Column({ name: 'required_roles', type: 'jsonb', default: () => "'[]'" })
  requiredRoles!: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  skills!: string[];

  @Column({ name: 'time_commitment', type: 'varchar', length: 40 })
  timeCommitment!: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    enumName: 'project_status_enum',
    default: ProjectStatus.OPEN,
  })
  status!: ProjectStatus;

  @OneToMany('Application', 'project')
  applications?: Application[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
