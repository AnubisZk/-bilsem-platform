import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ActivitiesService, CreateActivityLogDto } from "./activities.service";

@ApiTags("activities")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("activities")
export class ActivitiesController {
  constructor(private service: ActivitiesService) {}

  @Get()
  findAll(
    @Query("level") level?: any,
    @Query("topic") topic?: string,
    @Query("difficulty") difficulty?: any,
    @Query("moduleId") moduleId?: string,
    @Query("search") search?: string,
  ) {
    return this.service.findAll({ level, topic, difficulty, moduleId, search });
  }

  @Get("modules")
  getModules(@Query("level") level?: any) {
    return this.service.getModules(level);
  }

  @Get("logs")
  getLogs(
    @Request() req: any,
    @Query("groupId") groupId?: string,
    @Query("studentId") studentId?: string,
  ) {
    return this.service.getLogs(req.user.teacher?.id, groupId, studentId);
  }

  @Get("top")
  getTopActivities() {
    return this.service.getTopActivities();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post("log")
  logActivity(@Request() req: any, @Body() dto: CreateActivityLogDto) {
    return this.service.logActivity(req.user.teacher?.id, dto);
  }

  @Post("import-from-drive")
  importFromDrive(
    @Request() req: any,
    @Body() body: { fileId: string; accessToken: string; moduleId: string; level: string },
  ) {
    return this.service.importFromDrive(
      req.user.teacher?.id,
      body.fileId,
      body.accessToken,
      body.moduleId,
      body.level,
    );
  }
}
