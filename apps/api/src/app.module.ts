import { Module, NestModule, MiddlewareConsumer, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import type { CacheModuleOptions } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// Config
import { appConfig } from './config/app.config';
import { jwtConfig } from './config/jwt.config';
import { redisConfig } from './config/redis.config';

// Redis
import { RedisModule } from './common/redis/redis.module';
import {
  isUpstashConfigured,
  pingUpstashRedis,
} from './common/redis/upstash.client';
import { createUpstashCacheStore } from './common/redis/upstash-cache.store';
import { UpstashThrottlerStorage } from './common/redis/upstash-throttler.storage';

// Common
import { RequestContextModule } from './common/request-context/request-context.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

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
import { CrmModule } from './modules/crm/crm.module';
import { AdminModule } from './modules/admin/admin.module';
import { DailyPlanModule } from './modules/daily-plan/daily-plan.module';
import { TeacherNotesModule } from './modules/teacher-notes/teacher-notes.module';
import { StudentNotesModule } from './modules/student-notes/student-notes.module';
import { SearchModule } from './modules/search/search.module';
import { CvApplicationsModule } from './modules/cv-applications/cv-applications.module';

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
      load: [appConfig, jwtConfig, redisConfig],
      // Later files override earlier ones — prefer repo-root / cwd `.env`
      envFilePath: ['.env.local', '.env', '../../.env'],
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async (): Promise<CacheModuleOptions> => {
        const ttl = 2 * 60 * 1000;

        if (!isUpstashConfigured()) {
          Logger.warn('Cache: in-memory (Upstash env not set)', 'AppModule');
          return { ttl };
        }

        const ping = await pingUpstashRedis();
        if (!ping.ok) {
          Logger.error(
            `Cache: Upstash ping failed (${ping.error}), falling back to in-memory`,
            undefined,
            'AppModule',
          );
          return { ttl };
        }

        Logger.log('Cache: Upstash Redis', 'AppModule');
        return {
          store: createUpstashCacheStore(),
          ttl,
        };
      },
    }),

    ThrottlerModule.forRootAsync({
      useFactory: async () => {
        const throttlers = [
          {
            name: 'default',
            ttl: 60 * 1000,
            limit: 100,
          },
        ];

        if (!isUpstashConfigured()) {
          Logger.warn('Rate limit: in-memory (Upstash env not set)', 'AppModule');
          return throttlers;
        }

        const ping = await pingUpstashRedis();
        if (!ping.ok) {
          Logger.error(
            `Rate limit: Upstash ping failed (${ping.error}), falling back to in-memory`,
            undefined,
            'AppModule',
          );
          return throttlers;
        }

        Logger.log('Rate limit: Upstash Redis', 'AppModule');
        return {
          throttlers,
          storage: new UpstashThrottlerStorage(),
        };
      },
    }),

    // Global modules (RequestContext must be before Prisma so middleware can use it)
    RedisModule,
    RequestContextModule,
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
    CrmModule,
    AdminModule,
    DailyPlanModule,
    TeacherNotesModule,
    StudentNotesModule,
    SearchModule,
    CvApplicationsModule,
  ],
  providers: [
    // Correlation ID and request logging
    CorrelationIdMiddleware,
    // Production: no stack/sensitive data in error responses; uses ConfigService (.env)
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
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
    // Rate limiting guard (applies after auth so limits are per-IP)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
