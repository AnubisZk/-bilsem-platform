import { ApplicationsModule } from './applications/applications.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { GroupsModule } from './groups/groups.module';
import { ActivitiesModule } from './activities/activities.module';
import { QuestionsModule } from './questions/questions.module';
import { PlansModule } from './plans/plans.module';
import { FeedbackModule } from './feedback/feedback.module';
import { ReportsModule } from './reports/reports.module';
import { AiModule } from './ai/ai.module';
import { ResourcesModule } from './resources/resources.module';
import { GdriveModule } from './gdrive/gdrive.module';

@Module({
  imports: [ApplicationsModule, 
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    GroupsModule,
    ActivitiesModule,
    QuestionsModule,
    PlansModule,
    FeedbackModule,
    ReportsModule,
    AiModule,
    GdriveModule,
    ResourcesModule,
  ],
})
export class AppModule {}
