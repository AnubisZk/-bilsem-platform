import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { Level, Difficulty } from '@prisma/client';
import { IsString, IsNumber, IsEnum, IsOptional, IsArray, IsBoolean } from 'class-validator';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

export class CreateActivityLogDto {
  @IsString() @IsOptional() groupId?: string;
  @IsString() @IsOptional() activityId?: string;
  @IsString() date: string;
  @IsString() topic: string;
  @IsString() @IsOptional() notes?: string;
  @IsNumber() participation: number;
  @IsNumber() completion: number;
  @IsBoolean() @IsOptional() homeworkGiven?: boolean;
  @IsString() @IsOptional() homeworkDesc?: string;
  @IsNumber() duration: number;
  @IsArray() @IsOptional() studentPerformances?: Array<{
    studentId: string;
    performance: number;
    notes?: string;
    attended: boolean;
  }>;
}

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService, private aiService: AiService) {}

  async findAll(filters: any) {
    const where: any = {};
    if (filters.level) where.level = filters.level;
    if (filters.difficulty) where.difficulty = filters.difficulty;
    if (filters.moduleId) where.moduleId = filters.moduleId;
    if (filters.topic) where.topic = { contains: filters.topic, mode: "insensitive" };
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { topic: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    return this.prisma.activity.findMany({
      where,
      include: { module: true, _count: { select: { activityLogs: true } } },
      orderBy: { usageCount: "desc" },
    });
  }

  async findOne(id: string) {
    const a = await this.prisma.activity.findUnique({
      where: { id },
      include: { module: true },
    });
    if (!a) throw new NotFoundException("Etkinlik bulunamadi");
    return a;
  }

  async getModules(level?: any) {
    return this.prisma.module.findMany({
      where: level ? { level } : {},
      include: {
        _count: { select: { activities: true } },
        activities: {
          select: { id: true, title: true, topic: true, difficulty: true },
          orderBy: { topic: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });
  }

  async logActivity(teacherId: string, dto: CreateActivityLogDto) {
    const log = await this.prisma.activityLog.create({
      data: {
        teacherId,
        groupId: dto.groupId,
        activityId: dto.activityId,
        date: new Date(dto.date),
        topic: dto.topic,
        notes: dto.notes,
        participation: dto.participation,
        completion: dto.completion,
        homeworkGiven: dto.homeworkGiven || false,
        homeworkDesc: dto.homeworkDesc,
        duration: dto.duration,
      },
    });
    if (dto.studentPerformances?.length) {
      await this.prisma.studentActivityLog.createMany({
        data: dto.studentPerformances.map((sp) => ({
          activityLogId: log.id,
          studentId: sp.studentId,
          performance: sp.performance,
          notes: sp.notes,
          attended: sp.attended,
        })),
      });
    }
    if (dto.activityId) {
      await this.prisma.activity.update({
        where: { id: dto.activityId },
        data: { usageCount: { increment: 1 } },
      });
    }
    return log;
  }

  async getLogs(teacherId: string, groupId?: string, studentId?: string) {
    const where: any = { teacherId };
    if (groupId) where.groupId = groupId;
    if (studentId) where.studentLogs = { some: { studentId } };
    return this.prisma.activityLog.findMany({
      where,
      include: { activity: true, group: true, studentLogs: { include: { student: true } } },
      orderBy: { date: "desc" },
      take: 50,
    });
  }

  async getTopActivities() {
    return this.prisma.activity.findMany({
      orderBy: { usageCount: "desc" },
      take: 10,
      include: { module: true },
    });
  }

  async importFromDrive(teacherId: string, fileId: string, accessToken: string, moduleId: string, level: string): Promise<any> {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const buffer = await response.arrayBuffer();
    const data = await pdfParse(Buffer.from(buffer));
    const activities = await this.aiService.extractActivitiesFromText(data.text, level);
    const saved = [];
    for (const a of activities) {
      const activity = await this.prisma.activity.create({
        data: {
          moduleId,
          title: a.title || "Isimsiz Etkinlik",
          description: a.description || "",
          topic: a.topic || "Genel",
          objectives: a.objectives || [],
          materials: a.materials || [],
          duration: a.duration || 45,
          difficulty: (a.difficulty as any) || "ORTA",
          skills: a.skills || [],
          instructions: a.instructions || "",
          gradeRange: a.gradeRange || "5-8",
          level: level as any,
          isOfficial: false,
          sourceBook: "Drive PDF",
        },
      });
      saved.push(activity);
    }
    return { imported: saved.length, activities: saved };
  }
}
