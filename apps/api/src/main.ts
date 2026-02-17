// Load environment variables before anything else (needed for Prisma)
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load .env.local from project root
// Try multiple paths to handle different execution contexts (dev, build, etc.)
const possibleRootPaths = [
  resolve(process.cwd(), '.env.local'),           // If running from root
  resolve(process.cwd(), '../../.env.local'),    // If running from apps/api
  resolve(__dirname, '../../../.env.local'),     // If running from dist
];

// Find the first existing .env.local file
let envPath: string | undefined;
for (const path of possibleRootPaths) {
  if (existsSync(path)) {
    envPath = path;
    break;
  }
}

if (envPath) {
  config({ path: envPath });
  // Also try .env as fallback
  const envFallback = envPath.replace('.env.local', '.env');
  if (existsSync(envFallback)) {
    config({ path: envFallback });
  }
} else {
  // Fallback: try loading from current working directory
  config({ path: resolve(process.cwd(), '.env.local') });
  config({ path: resolve(process.cwd(), '.env') });
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Increase body size limit to handle base64 images (up to 15MB for JSON)
  // This is needed because base64-encoded images are ~33% larger than original
  app.use(json({ limit: '15mb' }));
  app.use(urlencoded({ limit: '15mb', extended: true }));

  // Global prefix
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  app.setGlobalPrefix(apiPrefix, {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });

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

  // Enable shutdown hooks to ensure Prisma disconnects properly
  app.enableShutdownHooks();

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
  // Render (и другие PaaS) задают порт через PORT
  const port =
    nodeEnv === 'production' && process.env.PORT
      ? Number(process.env.PORT)
      : Number(configService.get('API_PORT', 4000));
  
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/${apiPrefix}/docs`);
  console.log(`🌐 Network access: http://<your-ip>:${port}/${apiPrefix}`);
}

bootstrap();


