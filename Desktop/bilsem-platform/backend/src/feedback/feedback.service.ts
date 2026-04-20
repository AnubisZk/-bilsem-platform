import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { FeedbackStatus } from '@prisma/client';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateFeedbackDto {
  @IsString() studentId: string;
  @IsString() period: string;
  @IsString() strengths: string;
  @IsString() improvements: string;
  @IsString() nextGoals: string;
  @IsString() @IsOptional() motivation?: string;
  @IsBoolean() @IsOptional() aiGenerated?: boolean;
}

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService, private ai: AiService) {}

  async findAll(teacherId: string, studentId?: string) {
    return this.prisma.feedback.findMany({
      where: {
        teacherId,
        ...(studentId ? { studentId } : {}),
      },
      include: { student: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(teacherId: string, dto: CreateFeedbackDto) {
    return this.prisma.feedback.create({
      data: { ...dto, teacherId },
      include: { student: true },
    });
  }

  async update(id: string, dto: Partial<CreateFeedbackDto>) {
    return this.prisma.feedback.update({ where: { id }, data: dto });
  }

  async send(id: string) {
    return this.prisma.feedback.update({
      where: { id },
      data: { status: FeedbackStatus.GONDERILDI, sentAt: new Date() },
    });
  }

  async generateWithAI(teacherId: string, studentId: string, period: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        studentLogs: {
          include: { activityLog: { include: { activity: true } } },
          take: 20,
        },
      },
    });
    if (!student) throw new Error('Öğrenci bulunamadı');

    const activities = student.studentLogs
      .map((l) => l.activityLog.activity?.title || l.activityLog.topic)
      .filter(Boolean);
    const avgPerf =
      student.studentLogs.reduce((s, l) => s + l.performance, 0) /
      (student.studentLogs.length || 1);

    const ai = await this.ai.generateFeedback({
      studentName: `${student.name} ${student.surname}`,
      period,
      activities,
      performance: Math.round(avgPerf * 10) / 10,
      strengths: student.strengths,
      weaknesses: student.weaknesses,
    });

    return this.create(teacherId, {
      studentId,
      period,
      strengths: ai.strengths,
      improvements: ai.improvements,
      nextGoals: ai.nextGoals,
      motivation: ai.motivation,
      aiGenerated: true,
    });
  }

  async addObservation(teacherId: string, studentId: string, content: string, tags: string[]) {
    return this.prisma.observation.create({
      data: { teacherId, studentId, content, tags },
    });
  }

  async getObservations(studentId: string) {
    return this.prisma.observation.findMany({
      where: { studentId },
      include: { teacher: { include: { user: true } } },
      orderBy: { date: 'desc' },
    });
  }
}
