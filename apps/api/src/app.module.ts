import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

// Config
import { appConfig } from './config/app.config';
import { jwtConfig } from './config/jwt.config';

// Global Modules
import { PrismaModule } from './modules/prisma/prisma.module';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CentersModule } from './modules/centers/centers.module';
import { GroupsModule } from './modules/groups/groups.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { StudentsModule } from './modules/students/students.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { ChatModule } from './modules/chat/chat.module';
import { FinanceModule } from './modules/finance/finance.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { StorageModule } from './modules/storage/storage.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { SettingsModule } from './modules/settings/settings.module';

// Guards
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Global modules
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    CentersModule,
    GroupsModule,
    LessonsModule,
    AttendanceModule,
    StudentsModule,
    TeachersModule,
    ChatModule,
    FinanceModule,
    AnalyticsModule,
    NotificationsModule,
    StorageModule,
    FeedbackModule,
    SettingsModule,
  ],
  providers: [
    // Global JWT guard (can be overridden with @Public())
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global Roles guard
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
