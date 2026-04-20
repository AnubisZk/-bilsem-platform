import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService, private ai: AiService) {}

  async generateStudentReport(studentId: string, period: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        studentLogs: {
          include: { activityLog: { include: { activity: true } } },
          take: 50,
        },
        feedbacks: { where: { period } },
        observations: { orderBy: { date: 'desc' }, take: 10 },
        examResults: { include: { exam: true } },
        progressRecords: { where: { period } },
      },
    });
    if (!student) throw new Error('Öğrenci bulunamadı');

    const activityCount = student.studentLogs.length;
    const avgPerf =
      student.studentLogs.reduce((s: number, l: any) => s + l.performance, 0) /
      (activityCount || 1);
    const topics: string[] = [
      ...new Set(
        student.studentLogs.map(
          (l: any) => l.activityLog.activity?.topic || l.activityLog.topic,
        ),
      ),
    ] as string[];
    const examScores = (student.examResults as any[]).map((r: any) => r.score);
    const observations = (student.observations as any[]).map((o: any) => o.content);

    const aiReport = await this.ai.generateStudentReport({
      studentName: `${student.name} ${student.surname}`,
      period,
      activityCount,
      avgPerformance: Math.round(avgPerf * 10) / 10,
      topicsStudied: topics,
      examScores,
      observations,
    });

    return {
      student: {
        name: `${student.name} ${student.surname}`,
        school: student.school,
        grade: student.grade,
        level: student.level,
        mathLevel: student.mathLevel,
      },
      period,
      stats: {
        activityCount,
        avgPerformance: Math.round(avgPerf * 10) / 10,
        topicsStudied: topics,
        examScores,
        examAvg: examScores.length
          ? examScores.reduce((a: number, b: number) => a + b, 0) / examScores.length
          : null,
      },
      feedback: (student.feedbacks as any[])[0] || null,
      aiReport,
      observations: (student.observations as any[]).slice(0, 5),
      generatedAt: new Date().toISOString(),
    };
  }

  async generateGroupReport(groupId: string, period: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        groupStudents: {
          include: {
            student: {
              include: {
                studentLogs: { include: { activityLog: true }, take: 30 },
                examResults: true,
              },
            },
          },
        },
        activityLogs: {
          include: { activity: true },
          orderBy: { date: 'desc' },
          take: 50,
        },
      },
    });
    if (!group) throw new Error('Grup bulunamadı');

    const studentSummaries = (group.groupStudents as any[]).map((gs: any) => {
      const s = gs.student;
      const logs = s.studentLogs || [];
      const avgPerf =
        logs.reduce((sum: number, l: any) => sum + l.performance, 0) / (logs.length || 1);
      return {
        name: `${s.name} ${s.surname}`,
        grade: s.grade,
        activityCount: logs.length,
        avgPerformance: Math.round(avgPerf * 10) / 10,
        examAvg: s.examResults?.length
          ? s.examResults.reduce((sum: number, r: any) => sum + r.score, 0) / s.examResults.length
          : null,
      };
    });

    const topTopics = (group.activityLogs as any[]).reduce(
      (acc: Record<string, number>, log: any) => {
        const topic = log.activity?.topic || log.topic;
        acc[topic] = (acc[topic] || 0) + 1;
        return acc;
      },
      {},
    );

    return {
      group: { id: group.id, name: group.name, level: group.level },
      period,
      studentCount: (group.groupStudents as any[]).length,
      totalActivities: (group.activityLogs as any[]).length,
      studentSummaries,
      topTopics: Object.entries(topTopics)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([topic, count]) => ({ topic, count })),
      generatedAt: new Date().toISOString(),
    };
  }

  async getDashboardStats(teacherId: string) {
    const teacherStudentIds = await this.prisma.groupStudent
      .findMany({ where: { group: { teacherId } }, select: { studentId: true } })
      .then((gs) => gs.map((g) => g.studentId));

    const [studentCount, groupCount, weeklyActivityCount, pendingFeedbacks, topActivities, recentLogs] =
      await Promise.all([
        this.prisma.student.count({ where: { id: { in: teacherStudentIds }, isActive: true } }),
        this.prisma.group.count({ where: { teacherId, isActive: true } }),
        this.prisma.activityLog.count({
          where: { teacherId, date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        }),
        this.prisma.feedback.count({ where: { teacherId, status: 'TASLAK' } }),
        this.prisma.activity.findMany({
          orderBy: { usageCount: 'desc' },
          take: 5,
          select: { title: true, usageCount: true, topic: true },
        }),
        this.prisma.activityLog.findMany({
          where: { teacherId },
          include: { activity: true, group: true },
          orderBy: { date: 'desc' },
          take: 8,
        }),
      ]);

    return { studentCount, groupCount, weeklyActivityCount, pendingFeedbacks, topActivities, recentLogs };
  }
}
