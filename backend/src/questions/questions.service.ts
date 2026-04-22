import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Difficulty, QuestionType } from '@prisma/client';
import { IsString, IsEnum, IsOptional, IsArray, IsBoolean, IsNumber } from 'class-validator';

export class CreateQuestionDto {
  @IsString() title: string;
  @IsString() body: string;
  @IsOptional() options?: any;
  @IsString() @IsOptional() correctAnswer?: string;
  @IsString() @IsOptional() solution?: string;
  @IsString() topic: string;
  @IsString() @IsOptional() subTopic?: string;
  @IsString() gradeLevel: string;
  @IsEnum(Difficulty) difficulty: Difficulty;
  @IsEnum(QuestionType) type: QuestionType;
  @IsNumber() @IsOptional() duration?: number;
  @IsArray() @IsOptional() tags?: string[];
  @IsString() @IsOptional() imageUrl?: string;
  @IsString() @IsOptional() pdfUrl?: string;
  @IsBoolean() @IsOptional() isPublic?: boolean;
}

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(teacherId: string, filters: {
    topic?: string;
    difficulty?: Difficulty;
    type?: QuestionType;
    gradeLevel?: string;
    isPublic?: boolean;
    isFavorite?: boolean;
    search?: string;
    tags?: string[];
  }) {
    const where: any = {};

    // Kendi soruları + ortak havuz
    where.OR = [
      { teacherId },
      { isPublic: true },
    ];

    if (filters.topic) where.topic = { contains: filters.topic, mode: 'insensitive' };
    if (filters.difficulty) where.difficulty = filters.difficulty;
    if (filters.type) where.type = filters.type;
    if (filters.gradeLevel) where.gradeLevel = filters.gradeLevel;
    if (filters.isFavorite) where.isFavorite = true;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { body: { contains: filters.search, mode: 'insensitive' } },
        { topic: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.tags?.length) {
      where.questionTags = { some: { tag: { name: { in: filters.tags } } } };
    }

    return this.prisma.customQuestion.findMany({
      where,
      include: {
        questionTags: { include: { tag: true } },
        teacher: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const q = await this.prisma.customQuestion.findUnique({
      where: { id },
      include: { questionTags: { include: { tag: true } } },
    });
    if (!q) throw new NotFoundException('Soru bulunamadı');
    return q;
  }

  async create(teacherId: string, dto: CreateQuestionDto) {
    const { tags, ...data } = dto;

    const question = await this.prisma.customQuestion.create({
      data: {
        ...data,
        teacherId,
        tags: tags || [],
      },
    });

    // Tag'leri işle
    if (tags?.length) {
      for (const tagName of tags) {
        const tag = await this.prisma.tag.upsert({
          where: { name: tagName },
          create: { name: tagName },
          update: {},
        });
        await this.prisma.questionTag.create({
          data: { questionId: question.id, tagId: tag.id },
        });
      }
    }

    return this.findOne(question.id);
  }

  async update(id: string, dto: Partial<CreateQuestionDto>) {
    const { tags, ...data } = dto;
    const question = await this.prisma.customQuestion.update({
      where: { id },
      data,
    });

    if (tags) {
      await this.prisma.questionTag.deleteMany({ where: { questionId: id } });
      for (const tagName of tags) {
        const tag = await this.prisma.tag.upsert({
          where: { name: tagName },
          create: { name: tagName },
          update: {},
        });
        await this.prisma.questionTag.create({
          data: { questionId: id, tagId: tag.id },
        });
      }
    }

    return this.findOne(id);
  }

  async delete(id: string) {
    await this.prisma.questionTag.deleteMany({ where: { questionId: id } });
    return this.prisma.customQuestion.delete({ where: { id } });
  }

  async toggleFavorite(id: string) {
    const q = await this.prisma.customQuestion.findUnique({ where: { id } });
    return this.prisma.customQuestion.update({
      where: { id },
      data: { isFavorite: !q?.isFavorite },
    });
  }

  async createBulk(teacherId: string, questions: CreateQuestionDto[]) {
    const results = [];
    for (const dto of questions) {
      const q = await this.create(teacherId, { ...dto, aiGenerated: true } as any);
      results.push(q);
    }
    return results;
  }

  async getTopics(teacherId: string) {
    const questions = await this.prisma.customQuestion.findMany({
      where: { OR: [{ teacherId }, { isPublic: true }] },
      select: { topic: true, subTopic: true },
      distinct: ['topic'],
    });
    return [...new Set(questions.map((q) => q.topic))].sort();
  }

  async getStats(teacherId: string) {
    const [total, myQuestions, publicQuestions, byType, byDifficulty] = await Promise.all([
      this.prisma.customQuestion.count({ where: { OR: [{ teacherId }, { isPublic: true }] } }),
      this.prisma.customQuestion.count({ where: { teacherId } }),
      this.prisma.customQuestion.count({ where: { isPublic: true } }),
      this.prisma.customQuestion.groupBy({ by: ['type'], _count: true }),
      this.prisma.customQuestion.groupBy({ by: ['difficulty'], _count: true }),
    ]);
    return { total, myQuestions, publicQuestions, byType, byDifficulty };
  }
}
