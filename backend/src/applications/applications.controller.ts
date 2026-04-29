import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApplicationsService } from './applications.service';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  create(@Body() body: any) {
    return this.applicationsService.create(body);
  }

  @Get()
  findAll() {
    return this.applicationsService.findAll();
  }

  @Patch(':id/approve')
  approvePatch(@Param('id') id: string) {
    return this.applicationsService.approve(id);
  }

  @Put(':id/approve')
  approvePut(@Param('id') id: string) {
    return this.applicationsService.approve(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.applicationsService.reject(id);
  }
}
