import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Service responsible for lesson statistics
 */
@Injectable()
export class LessonStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLessonStatistics(teacherId?: string, dateFrom?: Date, dateTo?: Date) {
    const where: Prisma.LessonWhereInput = {};

    if (teacherId) where.teacherId = teacherId;

    if (dateFrom || dateTo) {
      where.scheduledAt = {};
      if (dateFrom) where.scheduledAt.gte = dateFrom;
      if (dateTo) where.scheduledAt.lte = dateTo;
    }

    // Ensure connection is healthy before executing multiple queries
    await this.prisma.ensureConnected();

    // Execute queries with retry logic for connection errors
    const executeQueries = async () => {
      return await Promise.all([
        this.prisma.lesson.count({ where }),
        this.prisma.lesson.count({ where: { ...where, status: 'COMPLETED' } }),
        this.prisma.lesson.count({ where: { ...where, status: 'CANCELLED' } }),
        this.prisma.lesson.count({ where: { ...where, status: 'MISSED' } }),
        this.prisma.lesson.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      ]);
    };

    // Retry up to 3 times with exponential backoff
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const [total, completed, cancelled, missed, inProgress] = await executeQueries();

        return {
          total,
          completed,
          cancelled,
          missed,
          inProgress,
          scheduled: total - completed - cancelled - missed - inProgress,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      } catch (error) {
        lastError = error;
        
        // Check if it's a connection error
        const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
        const isConnectionError = 
          errorMessage.includes('server has closed the connection') ||
          errorMessage.includes('connection reset') ||
          errorMessage.includes('econnreset') ||
          errorMessage.includes('connection closed') ||
          errorMessage.includes('code 10054') ||
          errorMessage.includes('forcibly closed');

        if (!isConnectionError || attempt === 2) {
          throw error;
        }

        // Wait before retry (exponential backoff: 100ms, 200ms)
        await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt)));
        
        // Ensure connection before retry
        try {
          await this.prisma.ensureConnected();
        } catch (reconnectError) {
          // If reconnection fails, wait a bit more and continue
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }
    }

    throw lastError;
  }
}




