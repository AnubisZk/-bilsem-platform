import { Module } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createTeacher(data: {
    email: string;
    password: string;
    name: string;
    institution?: string;
    title?: string;
  }) {
    const hash = await bcrypt.hash(data.password, 12);
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hash,
        name: data.name,
        role: 'TEACHER',
        teacher: {
          create: {
            institution: data.institution || 'Altıeylül BİLSEM',
            title: data.title,
          },
        },
      },
      include: { teacher: true },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { teacher: true },
    });
    if (!user) return null;
    const { passwordHash, ...rest } = user as any;
    return rest;
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string; avatar?: string }) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  async getTeacherNotes(teacherId: string) {
    return this.prisma.teacherNote.findMany({
      where: { teacherId },
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async createNote(teacherId: string, data: { title: string; content: string; tags?: string[] }) {
    return this.prisma.teacherNote.create({
      data: { ...data, teacherId, tags: data.tags || [] },
    });
  }

  async updateNote(id: string, data: { title?: string; content?: string; isPinned?: boolean }) {
    return this.prisma.teacherNote.update({ where: { id }, data });
  }

  async deleteNote(id: string) {
    return this.prisma.teacherNote.delete({ where: { id } });
  }
}

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Get('profile')
  getProfile(@Request() req: any) {
    return this.service.getProfile(req.user.id);
  }

  @Put('profile')
  updateProfile(@Request() req: any, @Body() body: any) {
    return this.service.updateProfile(req.user.id, body);
  }

  @Get('notes')
  getNotes(@Request() req: any) {
    return this.service.getTeacherNotes(req.user.teacher?.id);
  }

  @Post('notes')
  createNote(@Request() req: any, @Body() body: any) {
    return this.service.createNote(req.user.teacher?.id, body);
  }

  @Put('notes/:id')
  updateNote(@Param('id') id: string, @Body() body: any) {
    return this.service.updateNote(id, body);
  }

  @Put('notes/:id/pin')
  pinNote(@Param('id') id: string) {
    return this.service.updateNote(id, { isPinned: true });
  }
}

@Module({
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
