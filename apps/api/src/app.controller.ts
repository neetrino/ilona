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
   * Warmup endpoint: lightweight request to keep Render instance warm (no DB query).
   * Called by Vercel cron every 10 min. We intentionally do NOT hit the DB here so that
   * Neon can suspend when there is no real traffic. First real user request may have
   * slightly higher latency (Neon cold start) but saves unnecessary DB usage.
   */
  @Get('warmup')
  @Public()
  warmup() {
    return { ok: true };
  }
}




