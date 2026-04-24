import { Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  providers: [ResourcesService],
  controllers: [ResourcesController],
  exports: [ResourcesService],
})
export class ResourcesModule {}
