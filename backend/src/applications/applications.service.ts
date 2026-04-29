import { Injectable } from '@nestjs/common';

@Injectable()
export class ApplicationsService {
  private applications: any[] = [];

  create(data: any) {
    const item = {
      id: Date.now().toString(),
      createdAt: new Date(),
      status: 'PENDING',
      ...data
    };

    this.applications.unshift(item);
    return item;
  }

  findAll() {
    return this.applications;
  }

  approve(id: string) {
    const app = this.applications.find(x => x.id === id);
    if (app) app.status = 'APPROVED';
    return app;
  }
}
