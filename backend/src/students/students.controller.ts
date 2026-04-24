import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StudentsService, CreateStudentDto } from './students.service';

@ApiTags('students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private studentsService: StudentsService) {}

  @Get()
  findAll(@Query('groupId') groupId?: string) {
    return this.studentsService.findAll(undefined, groupId);
  }

  @Get('stats')
  getDashboardStats() {
    return this.studentsService.getDashboardStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Get(':id/analytics')
  getAnalytics(@Param('id') id: string) {
    return this.studentsService.getStudentAnalytics(id);
  }

  @Post()
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateStudentDto>) {
    return this.studentsService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.studentsService.delete(id);
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(@Param('id') id: string, @UploadedFile() file: any) {
    return this.studentsService.uploadAvatar(id, file);
  }

  @Delete(':id/avatar')
  deleteAvatar(@Param('id') id: string) {
    return this.studentsService.deleteAvatar(id);
  }

  @Put(':id')
  updateStudent(@Param('id') id: string, @Body() body: any) {
    return this.studentsService.update(id, body);
  }

}
