import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApplicationsService } from './applications.service';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly service: ApplicationsService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Put(':id/approve')
  approve(@Param('id') id: string) {
    return this.service.approve(id);
  }
}
