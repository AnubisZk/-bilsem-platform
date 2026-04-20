import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AiModule } from '../ai/ai.module';
import { Controller, Get, Query, UseGuards, Request, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('dashboard')
  getDashboard(@Request() req) {
    return this.service.getDashboardStats(req.user.teacher?.id);
  }

  @Get('student/:id')
  getStudentReport(@Param('id') id: string, @Query('period') period: string) {
    return this.service.generateStudentReport(id, period || '2024-2025 Güz');
  }

  @Get('group/:id')
  getGroupReport(@Param('id') id: string, @Query('period') period: string) {
    return this.service.generateGroupReport(id, period || '2024-2025 Güz');
  }
}

@Module({
  imports: [AiModule],
  providers: [ReportsService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
