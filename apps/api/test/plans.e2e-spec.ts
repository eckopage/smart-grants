import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import * as argon2 from 'argon2';
import { Model } from 'mongoose';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PlanAudience } from '../src/plans/schemas/plan.schema';
import { User, UserRole } from '../src/users/schemas/user.schema';

describe('Plans (e2e)', () => {
  let app: INestApplication<App>;
  let adminAccessToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

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
    adminAccessToken = (loginRes.body as { accessToken: string }).accessToken;
  });

  afterEach(async () => {
    await app.close();
  });

  it('lists only active plans for the requested audience', async () => {
    await request(app.getHttpServer())
      .post('/admin/plans')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        key: `starter-${Date.now()}`,
        audience: PlanAudience.ENTREPRENEUR,
        name: 'Starter',
        priceMonthly: 39,
        priceYearly: 390,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/admin/plans')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        key: `basic-listing-${Date.now()}`,
        audience: PlanAudience.COMPANY,
        name: 'Basic Listing',
        priceMonthly: 99,
        priceYearly: 990,
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/plans')
      .query({ audience: PlanAudience.ENTREPRENEUR })
      .expect(200);

    const plans = res.body as { audience: string }[];
    expect(plans.length).toBeGreaterThan(0);
    expect(
      plans.every((p) => p.audience === (PlanAudience.ENTREPRENEUR as string)),
    ).toBe(true);
  });

  it('rejects plan creation for non-admin users', async () => {
    await request(app.getHttpServer())
      .post('/admin/plans')
      .send({
        key: 'unauthorized',
        audience: PlanAudience.ENTREPRENEUR,
        name: 'X',
        priceMonthly: 1,
        priceYearly: 1,
      })
      .expect(401);
  });

  it('rejects checkout for an unknown plan', async () => {
    const email = `user-${Date.now()}@example.com`;
    const password = 'a-strong-password';
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    const token = (loginRes.body as { accessToken: string }).accessToken;

    await request(app.getHttpServer())
      .post('/payments/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ planKey: 'does-not-exist', billingPeriod: 'monthly' })
      .expect(404);
  });
});
