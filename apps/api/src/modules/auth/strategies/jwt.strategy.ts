import { Injectable, UnauthorizedException, ServiceUnavailableException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../../../common/types/auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  /**
   * Log authentication diagnostics (dev only)
   */
  private logAuthDiagnostics(context: string, details: Record<string, unknown>) {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(`[JWT Auth] ${context}`, details);
    }
  }

  /**
   * Checks if an error is a database connection error.
   */
  private isDatabaseConnectionError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    // Prisma connection error codes
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

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    try {
      // Diagnostics: Log successful token extraction (dev only)
      this.logAuthDiagnostics('Token validated', {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      });

      const user = await this.usersService.findById(payload.sub);

      if (!user || user.status !== 'ACTIVE') {
        this.logAuthDiagnostics('User validation failed', {
          userId: payload.sub,
          userExists: !!user,
          userStatus: user?.status,
        });
        throw new UnauthorizedException('User not found or inactive');
      }

      return {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch (error) {
      // If it's a database connection error, return 503 instead of 500
      if (this.isDatabaseConnectionError(error)) {
        this.logger.error('Database connection error during JWT validation', error);
        throw new ServiceUnavailableException('Database unavailable, please retry');
      }

      // Re-throw UnauthorizedException as-is (user not found/inactive)
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // For other errors, log and re-throw
      this.logger.error('Unexpected error during JWT validation', error);
      throw error;
    }
  }
}
