import { Controller, Post, Body, UseGuards, Request, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { IsString, IsNumber, IsOptional, IsArray, IsEnum } from 'class-validator';

export class GenerateQuestionsDto {
  @IsString() topic: string;
  @IsString() @IsOptional() subTopic?: string;
  @IsString() gradeLevel: string;
  @IsString() difficulty: string;
  @IsString() type: string;
  @IsNumber() count: number;
  @IsString() @IsOptional() additionalContext?: string;
}

export class GenerateFeedbackDto {
  @IsString() studentId: string;
  @IsString() period: string;
}

export class GeneratePlanDto {
  @IsString() level: string;
  @IsString() gradeLevel: string;
  @IsNumber() weeklyHours: number;
  @IsNumber() totalWeeks: number;
  @IsString() @IsOptional() groupDescription?: string;
  @IsArray() @IsOptional() focusAreas?: string[];
}

export class AnalyzeTextDto {
  @IsString() text: string;
}

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private service: AiService) {}

  @Post('generate-questions')
  generateQuestions(@Body() dto: GenerateQuestionsDto) {
    return this.service.generateQuestions(dto);
  }

  @Post('generate-plan')
  generatePlan(@Body() dto: GeneratePlanDto) {
    return this.service.generateTopicPlan(dto);
  }

  @Post('analyze-text')
  analyzeText(@Body() dto: AnalyzeTextDto) {
    return this.service.analyzeAndStructureQuestions(dto.text);
  }
}
