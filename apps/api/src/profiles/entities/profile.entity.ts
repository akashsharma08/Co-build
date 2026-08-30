import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ExperienceLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export enum AvailabilityRange {
  HOURS_2_5 = '2-5',
  HOURS_5_10 = '5-10',
  HOURS_10_20 = '10-20',
  HOURS_20_PLUS = '20+',
  FULL_TIME = 'full-time',
}

export enum ProfileVisibility {
  PUBLIC = 'public',
  PLATFORM = 'platform',
  HIDDEN = 'hidden',
}

export enum RemotePreference {
  REMOTE = 'remote',
  HYBRID = 'hybrid',
  ONSITE = 'onsite',
  FLEXIBLE = 'flexible',
}

export interface ProfileSkill {
  name: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience: number;
}

@Entity({ name: 'profiles' })
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 160, nullable: true })
  headline!: string | null;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  location!: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', length: 512, nullable: true })
  avatarUrl!: string | null;

  @Column({
    name: 'remote_preference',
    type: 'enum',
    enum: RemotePreference,
    enumName: 'remote_preference_enum',
    default: RemotePreference.FLEXIBLE,
  })
  remotePreference!: RemotePreference;

  @Column({
    name: 'experience_level',
    type: 'enum',
    enum: ExperienceLevel,
    enumName: 'experience_level_enum',
    default: ExperienceLevel.BEGINNER,
  })
  experienceLevel!: ExperienceLevel;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  languages!: string[];

  @Column({
    type: 'enum',
    enum: AvailabilityRange,
    enumName: 'availability_range_enum',
    default: AvailabilityRange.HOURS_5_10,
  })
  availability!: AvailabilityRange;

  @Column({
    type: 'enum',
    enum: ProfileVisibility,
    enumName: 'profile_visibility_enum',
    default: ProfileVisibility.PUBLIC,
  })
  visibility!: ProfileVisibility;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  skills!: ProfileSkill[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  interests!: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
