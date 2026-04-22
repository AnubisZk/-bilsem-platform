import { Module } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { Level } from '@prisma/client';
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsEnum, IsNumber, IsOptional, IsArray } from 'class-validator';
import { AiModule } from '../ai/ai.module';

export class CreatePlanDto {
  @IsString() title: string;
  @IsString() @IsOptional() description?: string;
  @IsEnum(Level) level: Level;
  @IsString() gradeLevel: string;
  @IsString() startDate: string;
  @IsString() endDate: string;
  @IsNumber() weeklyHours: number;
  @IsString() @IsOptional() groupId?: string;
}

export class AddPlanItemDto {
  @IsNumber() week: number;
  @IsNumber() @IsOptional() day?: number;
  @IsString() topic: string;
  @IsArray() objectives: string[];
  @IsNumber() duration: number;
  @IsString() @IsOptional() activityId?: string;
  @IsString() @IsOptional() notes?: string;
  @IsNumber() order: number;
}

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService, private ai: AiService) {}

  async findAll(teacherId: string) {
    return this.prisma.plan.findMany({
      where: { teacherId },
      include: {
        group: true,
        _count: { select: { planItems: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.plan.findUnique({
      where: { id },
      include: {
        group: true,
        planItems: {
          include: { activity: true },
          orderBy: [{ week: 'asc' }, { order: 'asc' }],
        },
      },
    });
  }

  async create(teacherId: string, dto: CreatePlanDto) {
    return this.prisma.plan.create({
      data: {
        ...dto,
        teacherId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  async addItem(planId: string, dto: AddPlanItemDto) {
    return this.prisma.planItem.create({
      data: { ...dto, planId },
      include: { activity: true },
    });
  }

  async removeItem(itemId: string) {
    return this.prisma.planItem.delete({ where: { id: itemId } });
  }

  async generateWithAI(teacherId: string, dto: CreatePlanDto & {
    focusAreas?: string[];
    groupDescription?: string;
  }) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    const totalWeeks = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));

    const plan = await this.create(teacherId, dto);

    const aiItems = await this.ai.generateTopicPlan({
      level: dto.level,
      gradeLevel: dto.gradeLevel,
      weeklyHours: dto.weeklyHours,
      totalWeeks,
      groupDescription: dto.groupDescription,
      focusAreas: dto.focusAreas,
    });

    for (let i = 0; i < aiItems.length; i++) {
      const item = aiItems[i];
      await this.prisma.planItem.create({
        data: {
          planId: plan.id,
          week: item.week,
          topic: item.topic,
          objectives: item.objectives || [],
          duration: item.duration || dto.weeklyHours * 60,
          notes: item.notes,
          order: i + 1,
        },
      });
    }

    return this.findOne(plan.id);
  }

  async delete(id: string) {
    await this.prisma.planItem.deleteMany({ where: { planId: id } });
    return this.prisma.plan.delete({ where: { id } });
  }
}

@UseGuards(JwtAuthGuard)
@Controller('plans')
export class PlansController {
  constructor(private service: PlansService) {}

  @Get()
  findAll(@Request() req) {
    return this.service.findAll(req.user.teacher?.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Request() req, @Body() dto: CreatePlanDto) {
    return this.service.create(req.user.teacher?.id, dto);
  }

  @Post('generate-ai')
  generateAI(@Request() req, @Body() dto: any) {
    return this.service.generateWithAI(req.user.teacher?.id, dto);
  }

  @Post(':id/items')
  addItem(@Param('id') id: string, @Body() dto: AddPlanItemDto) {
    return this.service.addItem(id, dto);
  }

  @Delete(':id/items/:itemId')
  removeItem(@Param('itemId') itemId: string) {
    return this.service.removeItem(itemId);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}

@Module({
  imports: [AiModule],
  providers: [PlansService],
  controllers: [PlansController],
  exports: [PlansService],
})
export class PlansModule {}
