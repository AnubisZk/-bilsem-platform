import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActivitiesService, CreateActivityLogDto } from './activities.service';
import { Level, Difficulty } from '@prisma/client';

@ApiTags('activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private service: ActivitiesService) {}

  @Get()
  findAll(
    @Query('level') level?: Level,
    @Query('topic') topic?: string,
    @Query('difficulty') difficulty?: Difficulty,
    @Query('moduleId') moduleId?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll({ level, topic, difficulty, moduleId, search });
  }

  @Get('modules')
  getModules(@Query('level') level?: Level) {
    return this.service.getModules(level);
  }

  @Get('logs')
  getLogs(
    @Request() req,
    @Query('groupId') groupId?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.service.getLogs(req.user.teacher?.id, groupId, studentId);
  }

  @Get('top')
  getTopActivities() {
    return this.service.getTopActivities();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('log')
  logActivity(@Request() req, @Body() dto: CreateActivityLogDto) {
    return this.service.logActivity(req.user.teacher?.id, dto);
  }
}
