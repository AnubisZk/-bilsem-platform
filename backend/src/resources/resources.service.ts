import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ResourcesService {
  constructor(private prisma: PrismaService, private ai: AiService) {}

  async assignResource(teacherId: string, studentId: string, data: {
    fileName: string;
    fileType: string;
    driveFileId: string;
    driveUrl: string;
    dueDate?: string;
  }) {
    return this.prisma.studentResource.create({
      data: {
        studentId,
        teacherId,
        fileName: data.fileName,
        fileType: data.fileType,
        driveFileId: data.driveFileId,
        driveUrl: data.driveUrl,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        status: 'ATANDI',
        isVisible: false,
      },
    });
  }

  async getStudentResources(studentId: string) {
    return this.prisma.studentResource.findMany({
      where: { studentId },
      include: {
        aiPlan: {
          include: {
            planItems: {
              include: { progress: true },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async getVisibleResources(studentId: string) {
    return this.prisma.studentResource.findMany({
      where: { studentId, isVisible: true },
      include: {
        aiPlan: {
          where: { isApproved: true },
          include: {
            planItems: {
              include: {
                progress: {
                  where: { studentId },
                },
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async deleteResource(id: string) {
    return this.prisma.studentResource.delete({ where: { id } });
  }

  async approveAndPublish(resourceId: string) {
    const plan = await this.prisma.resourceAiPlan.findUnique({
      where: { resourceId },
    });
    if (plan) {
      await this.prisma.resourceAiPlan.update({
        where: { resourceId },
        data: { isApproved: true },
      });
    }
    return this.prisma.studentResource.update({
      where: { id: resourceId },
      data: { isVisible: true },
    });
  }

  async generateAiPlan(resourceId: string, accessToken: string) {
    const resource = await this.prisma.studentResource.findUnique({
      where: { id: resourceId },
      include: { student: true },
    });
    if (!resource) throw new NotFoundException('Kaynak bulunamadı');

    // Drive'dan dosya içeriğini çek
    let text = '';
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${resource.driveFileId}?alt=media`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (resource.fileType === 'pdf') {
        const buffer = await response.arrayBuffer();
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(Buffer.from(buffer));
        text = data.text;
      } else {
        text = await response.text();
      }
    } catch (e) {
      text = `Dosya adı: ${resource.fileName}`;
    }

    // AI ile plan oluştur
    const planData = await this.ai.generateResourcePlan(text, {
      studentName: `${resource.student.name} ${resource.student.surname}`,
      mathLevel: resource.student.mathLevel,
      level: resource.student.level,
    });

    // Mevcut planı sil
    const existing = await this.prisma.resourceAiPlan.findUnique({ where: { resourceId } });
    if (existing) {
      await this.prisma.resourcePlanItem.deleteMany({ where: { planId: existing.id } });
      await this.prisma.resourceAiPlan.delete({ where: { resourceId } });
    }

    // Yeni planı kaydet
    const plan = await this.prisma.resourceAiPlan.create({
      data: {
        resourceId,
        studentId: resource.studentId,
        title: planData.title || resource.fileName,
        summary: planData.summary,
        totalEstimatedQuestions: planData.totalQuestions || 0,
        generatedByAI: true,
        isApproved: false,
        planItems: {
          create: (planData.items || []).map((item: any, i: number) => ({
            topic: item.topic,
            subtopic: item.subtopic || '',
            description: item.description || '',
            estimatedQuestionCount: item.questionCount || 0,
            suggestedDuration: item.duration || 30,
            orderIndex: i,
            teacherNote: item.teacherNote || '',
            studentGoal: item.goal || '',
          })),
        },
      },
      include: { planItems: true },
    });

    return plan;
  }

  async updatePlanItem(itemId: string, data: {
    topic?: string;
    subtopic?: string;
    description?: string;
    estimatedQuestionCount?: number;
    suggestedDuration?: number;
    teacherNote?: string;
    studentGoal?: string;
  }) {
    return this.prisma.resourcePlanItem.update({
      where: { id: itemId },
      data,
    });
  }

  async updateProgress(planItemId: string, studentId: string, data: {
    isCompleted?: boolean;
    solvedCount?: number;
    correctCount?: number;
    wrongCount?: number;
    blankCount?: number;
    difficultyLevel?: any;
    studentNote?: string;
  }) {
    const progress = await this.prisma.studentPlanProgress.upsert({
      where: { planItemId_studentId: { planItemId, studentId } },
      create: {
        planItemId,
        studentId,
        ...data,
        completedAt: data.isCompleted ? new Date() : undefined,
      },
      update: {
        ...data,
        completedAt: data.isCompleted ? new Date() : undefined,
      },
    });

    // Kaynak statusunu güncelle
    const item = await this.prisma.resourcePlanItem.findUnique({
      where: { id: planItemId },
      include: {
        plan: {
          include: {
            planItems: {
              include: { progress: { where: { studentId } } },
            },
          },
        },
      },
    });

    if (item) {
      const allItems = item.plan.planItems;
      const completedCount = allItems.filter((i: any) =>
        i.progress.some((p: any) => p.isCompleted)
      ).length;

      if (completedCount === allItems.length) {
        await this.prisma.studentResource.update({
          where: { id: item.plan.resourceId },
          data: { status: 'TAMAMLANDI' },
        });
      } else if (completedCount > 0) {
        await this.prisma.studentResource.update({
          where: { id: item.plan.resourceId },
          data: { status: 'DEVAM_EDIYOR' },
        });
      }
    }

    return progress;
  }

  async addTeacherFeedback(planItemId: string, studentId: string, feedback: string) {
    return this.prisma.studentPlanProgress.upsert({
      where: { planItemId_studentId: { planItemId, studentId } },
      create: { planItemId, studentId, teacherFeedback: feedback },
      update: { teacherFeedback: feedback },
    });
  }

  async getStudentProgress(studentId: string) {
    const resources = await this.getVisibleResources(studentId);
    const stats = resources.map((r: any) => {
      const plan = r.aiPlan;
      if (!plan) return { resourceId: r.id, fileName: r.fileName, progress: 0 };
      const items = plan.planItems || [];
      const completed = items.filter((i: any) => i.progress?.[0]?.isCompleted).length;
      const totalSolved = items.reduce((s: number, i: any) => s + (i.progress?.[0]?.solvedCount || 0), 0);
      const totalCorrect = items.reduce((s: number, i: any) => s + (i.progress?.[0]?.correctCount || 0), 0);
      return {
        resourceId: r.id,
        fileName: r.fileName,
        totalItems: items.length,
        completedItems: completed,
        progress: items.length ? Math.round((completed / items.length) * 100) : 0,
        totalSolved,
        totalCorrect,
        successRate: totalSolved ? Math.round((totalCorrect / totalSolved) * 100) : 0,
      };
    });
    return stats;
  }
}
