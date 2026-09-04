import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Developer Task Management API (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;
  let createdTaskId: string;

  const testUser = {
    email: `test_${Date.now()}@example.com`,
    password: 'password123',
    name: 'Frontend Developer',
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'your-development-jwt-secret-key-change-in-production';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth Flow', () => {
    it('/api/v1/auth/register (POST) - Register user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user.email).toBe(testUser.email);
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('/api/v1/auth/login (POST) - Login user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          jwtToken = res.body.accessToken;
        });
    });

    it('/api/v1/users/me (GET) - Get user profile', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe(testUser.email);
          expect(res.body).not.toHaveProperty('password');
        });
    });
  });

  describe('Tasks Flow', () => {
    it('/api/v1/tasks (POST) - Create task', () => {
      return request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          title: 'Build NestJS API',
          description: 'Learn NestJS for full-stack integration',
          priority: 'HIGH',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe('Build NestJS API');
          expect(res.body.status).toBe('OPEN');
          expect(res.body.priority).toBe('HIGH');
          createdTaskId = res.body.id;
        });
    });

    it('/api/v1/tasks (GET) - List tasks', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('/api/v1/tasks/:id (GET) - Fetch single task', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdTaskId);
        });
    });

    it('/api/v1/tasks/:id/complete (PATCH) - Mark task completed', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/tasks/${createdTaskId}/complete`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('COMPLETED');
        });
    });

    it('/api/v1/tasks/:id (DELETE) - Remove task', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
    });
  });
});
