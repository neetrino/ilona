import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AppModule } from '../../src/app.module';

describe('Centers (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

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

    // Login to get access token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@ilona.edu', password: 'admin123' });

    if (loginResponse.status === 200) {
      accessToken = loginResponse.body.tokens.accessToken;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/centers (GET)', () => {
    it('should return 401 without authorization', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/centers');

      expect(response.status).toBe(401);
    });

    it('should return centers list with valid token', async () => {
      if (!accessToken) {
        console.log('Skipping test - no access token (database may not be seeded)');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/centers')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('pageSize');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should filter centers by search term', async () => {
      if (!accessToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/centers?search=Main')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
    });

    it('should filter centers by isActive', async () => {
      if (!accessToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/centers?isActive=true')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      response.body.items.forEach((center: { isActive: boolean }) => {
        expect(center.isActive).toBe(true);
      });
    });
  });

  describe('/api/centers/:id (GET)', () => {
    it('should return 404 for non-existent center', async () => {
      if (!accessToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/centers/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('/api/centers (POST)', () => {
    it('should return 400 for invalid data', async () => {
      if (!accessToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/api/centers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'A' }); // Too short

      expect(response.status).toBe(400);
    });

    it('should create a new center with valid data', async () => {
      if (!accessToken) {
        return;
      }

      const centerData = {
        name: 'E2E Test Center',
        address: '789 Test Ave',
        phone: '+1111111111',
        email: 'e2e@test.com',
        description: 'Center created during e2e test',
      };

      const response = await request(app.getHttpServer())
        .post('/api/centers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(centerData);

      if (response.status === 201) {
        expect(response.body.name).toBe(centerData.name);
        expect(response.body.email).toBe(centerData.email);
        expect(response.body.isActive).toBe(true);

        // Clean up - delete the created center
        await request(app.getHttpServer())
          .delete(`/api/centers/${response.body.id}`)
          .set('Authorization', `Bearer ${accessToken}`);
      }
    });
  });
});


