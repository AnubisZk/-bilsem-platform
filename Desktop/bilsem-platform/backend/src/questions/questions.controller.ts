import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QuestionsService, CreateQuestionDto } from './questions.service';
import { Difficulty, QuestionType } from '@prisma/client';

@ApiTags('questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('questions')
export class QuestionsController {
  constructor(private service: QuestionsService) {}

  @Get()
  findAll(
    @Request() req,
    @Query('topic') topic?: string,
    @Query('difficulty') difficulty?: Difficulty,
    @Query('type') type?: QuestionType,
    @Query('gradeLevel') gradeLevel?: string,
    @Query('isFavorite') isFavorite?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(req.user.teacher?.id, {
      topic, difficulty, type, gradeLevel,
      isFavorite: isFavorite === 'true',
      search,
    });
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.service.getStats(req.user.teacher?.id);
  }

  @Get('topics')
  getTopics(@Request() req) {
    return this.service.getTopics(req.user.teacher?.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateQuestionDto) {
    return this.service.create(req.user.teacher?.id, dto);
  }

  @Post('bulk')
  createBulk(@Request() req, @Body() body: { questions: CreateQuestionDto[] }) {
    return this.service.createBulk(req.user.teacher?.id, body.questions);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateQuestionDto>) {
    return this.service.update(id, dto);
  }

  @Post(':id/favorite')
  toggleFavorite(@Param('id') id: string) {
    return this.service.toggleFavorite(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
