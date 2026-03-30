import { Injectable, UnauthorizedException, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtPayload, AuthTokens, AuthResponse, SafeUser } from '../../common/types/auth.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    try {
      const { email, password } = loginDto;

      // Find user
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check password
      if (!user.passwordHash) {
        this.logger.error(`User ${email} has no password hash`);
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user is active
      if (user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Account is not active');
      }

      // Update last login
      try {
        await this.usersService.updateLastLogin(user.id);
      } catch (error) {
        this.logger.warn(`Failed to update last login for user ${user.id}`, error);
        // Don't fail login if this fails
      }

      // Generate tokens
      const managerCenterId = user.role === 'MANAGER'
        ? await this.usersService.getManagerCenterId(user.id)
        : null;

      const tokens = await this.generateTokens({
        sub: user.id,
        email: user.email,
        role: user.role,
        managerCenterId,
      });

      // Return response (without passwordHash)
      const safeUser: SafeUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role,
        managerCenterId,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return {
        user: safeUser,
        tokens,
      };
    } catch (error) {
      // Re-throw UnauthorizedException as-is
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Log the actual error for debugging
      this.logger.error('Login error', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Login failed. Please try again.');
    }
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      // Find user
      const user = await this.usersService.findById(payload.sub);
      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Invalid token');
      }

      // Generate new tokens
      const managerCenterId = user.role === 'MANAGER'
        ? await this.usersService.getManagerCenterId(user.id)
        : null;

      return this.generateTokens({
        sub: user.id,
        email: user.email,
        role: user.role,
        managerCenterId,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ success: boolean }> {
    const user = await this.usersService.findAuthById(userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User not found or inactive');
    }

    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(userId, newPasswordHash);

    return { success: true };
  }

  private async generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<AuthTokens> {
    try {
      // Get JWT config values with fallbacks to prevent undefined errors
      const accessExpiration = this.configService.get<string>('jwt.accessExpiration') || '15m';
      const refreshExpiration = this.configService.get<string>('jwt.refreshExpiration') || '7d';
      const jwtSecret = this.configService.get<string>('jwt.secret');

      // Validate that we have a secret
      if (!jwtSecret) {
        this.logger.error('JWT secret is not configured');
        throw new InternalServerErrorException('JWT configuration error');
      }

      // Validate payload
      if (!payload.sub || !payload.email || !payload.role) {
        this.logger.error('Invalid JWT payload', payload);
        throw new InternalServerErrorException('Invalid token payload');
      }

      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(payload, {
          expiresIn: accessExpiration,
        }),
        this.jwtService.signAsync(payload, {
          expiresIn: refreshExpiration,
        }),
      ]);

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      this.logger.error('Token generation error', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to generate authentication tokens');
    }
  }
}
