import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Level } from '@prisma/client';
import { IsString, IsEnum, IsOptional, IsNumber, IsArray } from 'class-validator';

export class CreateGroupDto {
  @IsString() name: string;
  @IsString() @IsOptional() description?: string;
  @IsEnum(Level) level: Level;
  @IsString() @IsOptional() color?: string;
  @IsString() @IsOptional() icon?: string;
  @IsNumber() @IsOptional() maxSize?: number;
}

export class AssignStudentsDto {
  @IsArray() studentIds: string[];
}

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async findAll(teacherId: string) {
    return this.prisma.group.findMany({
      where: { teacherId, isActive: true },
      include: {
        groupStudents: {
          include: { student: true },
        },
        _count: { select: { activityLogs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        groupStudents: { include: { student: true } },
        activityLogs: {
          include: { activity: true },
          orderBy: { date: 'desc' },
          take: 20,
        },
        plans: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!group) throw new NotFoundException('Grup bulunamadı');
    return group;
  }

  async create(teacherId: string, dto: CreateGroupDto) {
    return this.prisma.group.create({
      data: { ...dto, teacherId },
    });
  }

  async update(id: string, dto: Partial<CreateGroupDto>) {
    return this.prisma.group.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    return this.prisma.group.update({ where: { id }, data: { isActive: false } });
  }

  async assignStudents(groupId: string, dto: AssignStudentsDto) {
    // Mevcut atamaları temizle
    await this.prisma.groupStudent.deleteMany({ where: { groupId } });
    // Yeni atamalar
    if (dto.studentIds.length > 0) {
      await this.prisma.groupStudent.createMany({
        data: dto.studentIds.map((studentId) => ({ groupId, studentId })),
        skipDuplicates: true,
      });
    }
    return this.findOne(groupId);
  }

  async addStudent(groupId: string, studentId: string) {
    return this.prisma.groupStudent.upsert({
      where: { groupId_studentId: { groupId, studentId } },
      create: { groupId, studentId },
      update: {},
    });
  }

  async removeStudent(groupId: string, studentId: string) {
    return this.prisma.groupStudent.delete({
      where: { groupId_studentId: { groupId, studentId } },
    });
  }

  async getGroupStats(groupId: string) {
    const [studentCount, logCount, avgParticipation] = await Promise.all([
      this.prisma.groupStudent.count({ where: { groupId } }),
      this.prisma.activityLog.count({ where: { groupId } }),
      this.prisma.activityLog.aggregate({
        where: { groupId },
        _avg: { participation: true, completion: true },
      }),
    ]);
    return {
      studentCount,
      logCount,
      avgParticipation: avgParticipation._avg.participation,
      avgCompletion: avgParticipation._avg.completion,
    };
  }
}
