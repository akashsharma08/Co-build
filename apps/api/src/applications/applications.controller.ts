import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { User } from '../users/entities/user.entity';
import {
  CreateApplicationDto,
  ReviewApplicationDto,
} from './dto/application.dto';
import { ApplicationsService } from './applications.service';

@ApiTags('Applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post('projects/:projectId/applications')
  @ApiOperation({ summary: 'Apply to join a project' })
  @ApiCreatedResponse()
  apply(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationsService.apply(projectId, user.id, dto);
  }

  @Get('projects/:projectId/applications')
  @ApiOperation({ summary: 'List applications for a project I own' })
  @ApiOkResponse()
  listForProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: User,
  ) {
    return this.applicationsService.findForProject(projectId, user.id);
  }

  @Get('applications/mine')
  @ApiOperation({ summary: 'List my applications' })
  mine(@CurrentUser() user: User) {
    return this.applicationsService.findMine(user.id);
  }

  @Patch('applications/:id')
  @ApiOperation({ summary: 'Accept, reject, or shortlist an application' })
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: ReviewApplicationDto,
  ) {
    return this.applicationsService.review(id, user.id, dto);
  }
}
