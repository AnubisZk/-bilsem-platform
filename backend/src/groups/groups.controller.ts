import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GroupsService, CreateGroupDto, AssignStudentsDto } from './groups.service';

@ApiTags('groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private service: GroupsService) {}

  @Get()
  findAll(@Request() req) {
    return this.service.findAll(req.user.teacher?.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.service.getGroupStats(id);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateGroupDto) {
    return this.service.create(req.user.teacher?.id, dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateGroupDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Post(':id/students')
  assignStudents(@Param('id') id: string, @Body() dto: AssignStudentsDto) {
    return this.service.assignStudents(id, dto);
  }

  @Post(':id/students/:studentId')
  addStudent(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.service.addStudent(id, studentId);
  }

  @Delete(':id/students/:studentId')
  removeStudent(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.service.removeStudent(id, studentId);
  }
}
