import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('jwt.secret') || 'default-secret-change-in-production';
        const accessExpiration = configService.get<string>('jwt.accessExpiration') || '15m';
        
        return {
          secret,
          signOptions: {
            expiresIn: accessExpiration,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  // Export JwtModule so other modules (e.g., ChatModule) reuse the same JwtService configuration
  exports: [AuthService, JwtModule],
})
export class AuthModule {}


