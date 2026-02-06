import { Injectable, NotFoundException, ServiceUnavailableException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Checks if an error is a database connection error.
   */
  private isDatabaseConnectionError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const prismaConnectionErrorCodes = [
      'P1001', // Can't reach database server
      'P1002', // Database server closed the connection
      'P1008', // Operations timed out
      'P1017', // Server has closed the connection
    ];

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return prismaConnectionErrorCodes.includes(error.code);
    }

    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      const message = error.message.toLowerCase();
      return (
        message.includes('server has closed the connection') ||
        message.includes('connection reset') ||
        message.includes('econnreset') ||
        message.includes('connection closed')
      );
    }

    const message = error.message.toLowerCase();
    return (
      message.includes('econnreset') ||
      message.includes('connection reset') ||
      message.includes('server has closed the connection') ||
      (error as any).code === 'ECONNRESET' ||
      (error as any).code === 10054
    );
  }

  async findByEmail(email: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      if (this.isDatabaseConnectionError(error)) {
        this.logger.error('Database connection error in findByEmail', error);
        throw new ServiceUnavailableException('Database unavailable, please retry');
      }
      throw error;
    }
  }

  async findById(id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          teacher: true,
          student: {
            include: {
              group: {
                include: {
                  center: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      // Re-throw NotFoundException as-is
      if (error instanceof NotFoundException) {
        throw error;
      }

      // If it's a database connection error, return 503
      if (this.isDatabaseConnectionError(error)) {
        this.logger.error('Database connection error in findById', error);
        throw new ServiceUnavailableException('Database unavailable, please retry');
      }

      // Re-throw other errors
      throw error;
    }
  }

  async findAll(filters?: { role?: UserRole; status?: string }) {
    return this.prisma.user.findMany({
      where: {
        role: filters?.role,
        status: filters?.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | undefined,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateLastLogin(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async update(userId: string, data: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string }) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(data.firstName !== undefined && { firstName: data.firstName }),
          ...(data.lastName !== undefined && { lastName: data.lastName }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          teacher: true,
          student: {
            include: {
              group: {
                include: {
                  center: true,
                },
              },
            },
          },
        },
      });

      return user;
    } catch (error) {
      if (this.isDatabaseConnectionError(error)) {
        this.logger.error('Database connection error in update', error);
        throw new ServiceUnavailableException('Database unavailable, please retry');
      }
      throw error;
    }
  }
}
