import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { IsString, IsNumber, IsEnum, IsOptional, IsArray } from 'class-validator';
import { Level } from '@prisma/client';

export class CreateStudentDto {
  @IsString() name: string;
  @IsString() surname: string;
  @IsString() school: string;
  @IsNumber() grade: number;
  @IsEnum(Level) level: Level;
  @IsString() bilsemLevel: string;
  @IsString() mathLevel: string;
  @IsArray() @IsOptional() strengths?: string[];
  @IsArray() @IsOptional() weaknesses?: string[];
  @IsArray() @IsOptional() interests?: string[];
  @IsString() @IsOptional() notes?: string;
  @IsString() @IsOptional() parentId?: string;
}

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(teacherId?: string, groupId?: string) {
    const where: any = { isActive: true };
    if (groupId) {
      where.groupStudents = { some: { groupId } };
    }
    return this.prisma.student.findMany({
      where,
      include: {
        groupStudents: { include: { group: true } },
        parent: true,
        _count: {
          select: { studentLogs: true, feedbacks: true, observations: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        groupStudents: { include: { group: true } },
        parent: true,
        studentLogs: {
          include: { activityLog: { include: { activity: true } } },
          orderBy: { activityLog: { date: 'desc' } },
          take: 20,
        },
        feedbacks: { orderBy: { createdAt: 'desc' }, take: 5 },
        observations: { orderBy: { date: 'desc' }, take: 10 },
        progressRecords: { orderBy: { date: 'desc' } },
        examResults: {
          include: { exam: true },
          orderBy: { completedAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!student) throw new NotFoundException('Öğrenci bulunamadı');
    return student;
  }

  async create(data: CreateStudentDto) {
    const code = `STU-${Date.now().toString(36).toUpperCase()}`;
    return this.prisma.student.create({
      data: {
        ...data,
        studentCode: code,
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        interests: data.interests || [],
      },
    });
  }

  async update(id: string, data: Partial<CreateStudentDto>) {
    return this.prisma.student.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.student.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getStudentAnalytics(studentId: string) {
    const [logCount, avgPerformance, logs, examResults] = await Promise.all([
      this.prisma.studentActivityLog.count({ where: { studentId } }),
      this.prisma.studentActivityLog.aggregate({
        where: { studentId },
        _avg: { performance: true },
      }),
      this.prisma.studentActivityLog.findMany({
        where: { studentId },
        include: { activityLog: { include: { activity: true } } },
        orderBy: { activityLog: { date: 'desc' } },
        take: 50,
      }),
      this.prisma.examResult.findMany({
        where: { studentId },
        include: { exam: true },
        orderBy: { completedAt: 'desc' },
      }),
    ]);

    const topicMap = new Map<string, { count: number; totalPerf: number }>();
    for (const log of logs) {
      const topic = (log.activityLog as any).activity?.topic || log.activityLog.topic;
      if (!topicMap.has(topic)) topicMap.set(topic, { count: 0, totalPerf: 0 });
      const t = topicMap.get(topic)!;
      t.count++;
      t.totalPerf += log.performance;
    }

    return {
      totalActivities: logCount,
      avgPerformance: avgPerformance._avg.performance?.toFixed(1) || 0,
      topicBreakdown: Array.from(topicMap.entries()).map(([topic, data]) => ({
        topic,
        count: data.count,
        avgPerformance: (data.totalPerf / data.count).toFixed(1),
      })),
      examResults: examResults.map((r: any) => ({
        title: r.exam.title,
        score: r.score,
        date: r.completedAt,
      })),
    };
  }

  async getDashboardStats() {
    const [total, active, byLevel, byGrade] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.student.count({ where: { isActive: true } }),
      this.prisma.student.groupBy({ by: ['level'], _count: true }),
      this.prisma.student.groupBy({ by: ['grade'], _count: true, orderBy: { grade: 'asc' } }),
    ]);
    return { total, active, byLevel, byGrade };
  }

  async createPortalAccount(studentId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new Error('Öğrenci bulunamadı');

    // Otomatik şifre: AdSoyad2026
    const initials = (student.name.charAt(0) + student.surname.charAt(0)).toUpperCase();
    const password = initials + '2026';
    const hash = await bcrypt.hash(password, 12);
    const email = student.studentCode.toLowerCase() + '@bilsem.edu.tr';

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { email, password, exists: true };
    }

    await this.prisma.user.create({
      data: {
        email,
        passwordHash: hash,
        name: student.name + ' ' + student.surname,
        role: 'STUDENT',
        student: { connect: { id: studentId } },
      },
    });

    return { email, password, exists: false };
  }

  async getPortalData(studentId: string) {
    return this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        groupStudents: {
          include: {
            group: {
              include: {
                plans: {
                  include: {
                    planItems: {
                      include: { activity: true },
                      orderBy: [{ week: 'asc' }, { order: 'asc' }],
                    },
                  },
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
        studentLogs: {
          include: { activityLog: { include: { activity: true } } },
          orderBy: { activityLog: { date: 'desc' } },
          take: 20,
        },
        feedbacks: {
          where: { status: 'GONDERILDI' },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
  }

}
