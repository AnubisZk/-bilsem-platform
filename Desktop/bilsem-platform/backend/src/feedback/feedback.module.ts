import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { AiModule } from '../ai/ai.module';
import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateFeedbackDto } from './feedback.service';
import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateObservationDto {
  @IsString() studentId: string;
  @IsString() content: string;
  @IsArray() @IsOptional() tags?: string[];
}

@UseGuards(JwtAuthGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private service: FeedbackService) {}

  @Get()
  findAll(@Request() req, @Query('studentId') studentId?: string) {
    return this.service.findAll(req.user.teacher?.id, studentId);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateFeedbackDto) {
    return this.service.create(req.user.teacher?.id, dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateFeedbackDto>) {
    return this.service.update(id, dto);
  }

  @Post(':id/send')
  send(@Param('id') id: string) {
    return this.service.send(id);
  }

  @Post('generate-ai')
  generateWithAI(
    @Request() req,
    @Body() body: { studentId: string; period: string },
  ) {
    return this.service.generateWithAI(req.user.teacher?.id, body.studentId, body.period);
  }

  @Post('observation')
  addObservation(@Request() req, @Body() dto: CreateObservationDto) {
    return this.service.addObservation(
      req.user.teacher?.id,
      dto.studentId,
      dto.content,
      dto.tags || [],
    );
  }

  @Get('observations/:studentId')
  getObservations(@Param('studentId') studentId: string) {
    return this.service.getObservations(studentId);
  }
}

@Module({
  imports: [AiModule],
  providers: [FeedbackService],
  controllers: [FeedbackController],
  exports: [FeedbackService],
})
export class FeedbackModule {}
