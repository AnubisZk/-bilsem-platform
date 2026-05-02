import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResourcesService } from './resources.service';

@ApiTags('resources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ResourcesController {
  constructor(private service: ResourcesService) {}

  // Öğrenciye kaynak ata
  @Post('students/:studentId/resources')
  assignResource(
    @Request() req: any,
    @Param('studentId') studentId: string,
    @Body() body: any,
  ) {
    return this.service.assignResource(req.user.teacher?.id, studentId, body);
  }

  // Öğrencinin kaynaklarını listele (öğretmen)
  @Get('students/:studentId/resources')
  getResources(@Param('studentId') studentId: string) {
    return this.service.getStudentResources(studentId);
  }

  // Kaynağı sil
  @Delete('students/:studentId/resources/:resourceId')
  deleteResource(@Param('resourceId') resourceId: string) {
    return this.service.deleteResource(resourceId);
  }

  // AI plan oluştur
  @Post('resources/:resourceId/generate-plan')
  generatePlan(
    @Param('resourceId') resourceId: string,
    @Body() body: { accessToken: string },
  ) {
    return this.service.generateAiPlan(resourceId, body.accessToken);
  }

  // Planı onayla ve öğrenciye görünür yap
  @Post('resources/:resourceId/approve')
  approvePlan(@Param('resourceId') resourceId: string) {
    return this.service.approveAndPublish(resourceId);
  }


  // Plan başlığını ve özetini güncelle
  @Put('resource-plans/:planId')
  updatePlan(@Param('planId') planId: string, @Body() body: any) {
    return this.service.updatePlan(planId, body);
  }

  // Plana yeni madde ekle
  @Post('resource-plans/:planId/items')
  createPlanItem(@Param('planId') planId: string, @Body() body: any) {
    return this.service.createPlanItem(planId, body);
  }

  // Plan maddelerini yeniden sırala
  @Put('resource-plans/:planId/reorder')
  reorderPlanItems(
    @Param('planId') planId: string,
    @Body() body: { items: { id: string; orderIndex: number }[] },
  ) {
    return this.service.reorderPlanItems(planId, body.items || []);
  }

  // Plan maddesini sil
  @Delete('resource-plan-items/:itemId')
  deletePlanItem(@Param('itemId') itemId: string) {
    return this.service.deletePlanItem(itemId);
  }

  // Kaynağa ait AI planını tamamen sil
  @Delete('resources/:resourceId/plan')
  deleteResourcePlan(@Param('resourceId') resourceId: string) {
    return this.service.deleteResourcePlan(resourceId);
  }


  // Plan maddesini güncelle (öğretmen)
  @Put('resource-plan-items/:itemId')
  updatePlanItem(@Param('itemId') itemId: string, @Body() body: any) {
    return this.service.updatePlanItem(itemId, body);
  }

  // Öğretmen geri bildirimi ekle
  @Put('resource-plan-items/:itemId/feedback')
  addFeedback(
    @Param('itemId') itemId: string,
    @Body() body: { studentId: string; feedback: string },
  ) {
    return this.service.addTeacherFeedback(itemId, body.studentId, body.feedback);
  }

  // Portal: Öğrencinin görünür kaynakları
  @Get('portal/resources')
  getPortalResources(@Request() req: any) {
    return this.service.getVisibleResources(req.user.studentId);
  }

  // Portal: İlerleme güncelle
  @Put('portal/plan-items/:itemId/progress')
  updateProgress(
    @Request() req: any,
    @Param('itemId') itemId: string,
    @Body() body: any,
  ) {
    return this.service.updateProgress(itemId, req.user.studentId, body);
  }

  // Portal: Öğrenci genel istatistikleri
  @Get('portal/progress')
  getProgress(@Request() req: any) {
    return this.service.getStudentProgress(req.user.studentId);
  }
}
