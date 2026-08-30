import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  AvailabilityRange,
  ExperienceLevel,
  ProfileVisibility,
  RemotePreference,
} from '../entities/profile.entity';

class SkillDto {
  @IsString()
  @Length(1, 60)
  name!: string;

  @IsEnum(['beginner', 'intermediate', 'advanced', 'expert'] as const)
  proficiency!: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  yearsOfExperience!: number;
}

export class UpsertProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 160)
  headline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 120)
  location?: string;

  @ApiPropertyOptional({ enum: RemotePreference })
  @IsOptional()
  @IsEnum(RemotePreference)
  remotePreference?: RemotePreference;

  @ApiPropertyOptional({ enum: ExperienceLevel })
  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({ enum: AvailabilityRange })
  @IsOptional()
  @IsEnum(AvailabilityRange)
  availability?: AvailabilityRange;

  @ApiPropertyOptional({ enum: ProfileVisibility })
  @IsOptional()
  @IsEnum(ProfileVisibility)
  visibility?: ProfileVisibility;

  @ApiPropertyOptional({ type: [SkillDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  skills?: SkillDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  interests?: string[];
}
