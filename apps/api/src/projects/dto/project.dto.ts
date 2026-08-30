import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
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
} from 'class-validator';
import {
  ProjectGoal,
  ProjectStage,
  ProjectStatus,
} from '../entities/project.entity';

export class CreateProjectDto {
  @ApiProperty({ example: 'CoBuild Mobile App' })
  @IsString()
  @Length(3, 120)
  name!: string;

  @ApiProperty({ example: 'Find collaborators for side projects' })
  @IsString()
  @Length(10, 280)
  shortDescription!: string;

  @ApiProperty()
  @IsString()
  @Length(20, 10000)
  detailedDescription!: string;

  @ApiProperty({ example: 'Developer Tools' })
  @IsString()
  @Length(2, 80)
  category!: string;

  @ApiProperty({ enum: ProjectStage })
  @IsEnum(ProjectStage)
  stage!: ProjectStage;

  @ApiProperty({ enum: ProjectGoal })
  @IsEnum(ProjectGoal)
  goal!: ProjectGoal;

  @ApiProperty({ type: [String], example: ['backend developer', 'designer'] })
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  requiredRoles!: string[];

  @ApiProperty({ type: [String], example: ['NestJS', 'Next.js'] })
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  skills!: string[];

  @ApiProperty({ example: '5-10 hours/week' })
  @IsString()
  @Length(2, 40)
  timeCommitment!: string;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}

export class ListProjectsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 12;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(ProjectGoal)
  goal?: ProjectGoal;

  @IsOptional()
  @IsEnum(ProjectStage)
  stage?: ProjectStage;

  @IsOptional()
  @IsString()
  skill?: string;

  @IsOptional()
  @IsString()
  role?: string;
}
