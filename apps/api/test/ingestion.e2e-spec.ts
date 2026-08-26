import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import * as argon2 from 'argon2';
import { Model } from 'mongoose';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { User, UserRole } from '../src/users/schemas/user.schema';

describe('Ingestion admin (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  async function createAdminToken() {
    const userModel = app.get<Model<User>>(getModelToken(User.name));
    const email = `admin-${Date.now()}@example.com`;
    const password = 'admin-password';
    await userModel.create({
      email,
      passwordHash: await argon2.hash(password),
      role: UserRole.ADMIN,
    });
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    return (loginRes.body as { accessToken: string }).accessToken;
  }

  it('rejects run history and manual trigger for non-admins', async () => {
    await request(app.getHttpServer()).get('/admin/ingestion/runs').expect(401);
    await request(app.getHttpServer()).post('/admin/ingestion/run').expect(401);
  });

  it('lets an admin view run history (empty initially)', async () => {
    const token = await createAdminToken();
    const res = await request(app.getHttpServer())
      .get('/admin/ingestion/runs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
