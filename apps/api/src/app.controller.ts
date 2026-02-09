import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';
import { PrismaService } from './modules/prisma/prisma.service';

@Controller()
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
}




