import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  app.setGlobalPrefix(apiPrefix);

  // CORS
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:3000');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  
  // In development, allow all origins for easier local network access
  // In production, use strict CORS configuration
  const corsOptions = nodeEnv === 'production' 
    ? {
        origin: corsOrigin.split(',').map((origin: string) => origin.trim()),
        credentials: true,
      }
    : {
        origin: true, // Allow all origins in development
        credentials: true,
      };
  
  app.enableCors(corsOptions);

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Ilona English Center API')
      .setDescription('API documentation for Ilona English Center platform')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Enter JWT token',
          in: 'header',
        },
        'access-token',
      )
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('centers', 'Center management')
      .addTag('groups', 'Group management')
      .addTag('lessons', 'Lesson management')
      .addTag('attendance', 'Attendance tracking')
      .addTag('chat', 'Chat system')
      .addTag('finance', 'Finance & payments')
      .addTag('analytics', 'Analytics & reports')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  }

  // Start server - listen on all interfaces (0.0.0.0) to allow network access
  const port = configService.get<number>('API_PORT', 4000);
  const host = nodeEnv === 'production' ? '0.0.0.0' : '0.0.0.0'; // Listen on all interfaces
  await app.listen(port, host);

  console.log(`🚀 Application is running on: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/${apiPrefix}`);
  console.log(`📚 Swagger docs: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/${apiPrefix}/docs`);
  if (host === '0.0.0.0') {
    console.log(`🌐 Network access: http://<your-ip>:${port}/${apiPrefix}`);
  }
}

bootstrap();


