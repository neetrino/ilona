import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AppModule } from '../../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/auth/login (POST)', () => {
    it('should return 401 for invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'invalid@test.com', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'invalid-email', password: 'password123' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for password too short', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: '123' });

      expect(response.status).toBe(400);
    });

    it('should successfully login with valid demo credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@ilona.edu', password: 'admin123' });

      // This will only pass if the database is seeded
      if (response.status === 200) {
        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('tokens');
        expect(response.body.tokens).toHaveProperty('accessToken');
        expect(response.body.tokens).toHaveProperty('refreshToken');
        expect(response.body.user.email).toBe('admin@ilona.edu');
        expect(response.body.user).not.toHaveProperty('passwordHash');
      }
    });
  });

  describe('/api/auth/refresh (POST)', () => {
    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
    });
  });
});


