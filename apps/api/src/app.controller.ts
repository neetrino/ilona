import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from './common/decorators/public.decorator';
import { PrismaService } from './modules/prisma/prisma.service';

@Controller()
@SkipThrottle({ default: true }) // health, warmup, root: do not count toward rate limit
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  getRoot() {
    return {
      message: 'Ilona English Center API',
      version: '1.0',
      documentation: '/api/docs',
      status: 'running',
    };
  }

  @Get('health/db')
  @Public()
  async checkDatabaseHealth() {
    const health = await this.prisma.checkHealth();
    return {
      status: health.healthy ? 'healthy' : 'unhealthy',
      database: health.healthy
        ? { connected: true, latency: `${health.latency}ms` }
        : { connected: false, error: health.error },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Warmup endpoint: lightweight request to preload server (DB connection, middleware).
   * Called by the frontend as early as possible on first page load. No auth required.
   * Does not affect business logic; used only to reduce first-real-request latency.
   */
  @Get('warmup')
  @Public()
  async warmup() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  }
}




