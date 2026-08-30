import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { User } from '../users/entities/user.entity';
import { MembersService } from './members.service';

@ApiTags('Members')
@Controller()
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get('projects/:projectId/members')
  @ApiOperation({ summary: 'List project team members' })
  @ApiOkResponse()
  listForProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.membersService.findForProject(projectId);
  }

  @Get('members/mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List projects I belong to' })
  listMine(@CurrentUser() user: User) {
    return this.membersService.findMine(user.id);
  }
}
