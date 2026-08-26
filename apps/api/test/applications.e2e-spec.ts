import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import * as argon2 from 'argon2';
import { Model, Types } from 'mongoose';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GrantSource, GrantType } from '../src/grants/constants';
import { Plan, PlanAudience } from '../src/plans/schemas/plan.schema';
import {
  BillingPeriod,
  Subscription,
  SubscriptionStatus,
} from '../src/subscriptions/schemas/subscription.schema';
import { User, UserRole } from '../src/users/schemas/user.schema';

describe('Applications (e2e)', () => {
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

  function uniqueEmail(label: string) {
    return `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  }

  async function registerAndLogin(role: 'entrepreneur' | 'company') {
    const email = uniqueEmail(role);
    const password = 'a-strong-password';
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, role })
      .expect(201);
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    return {
      email,
      token: (loginRes.body as { accessToken: string }).accessToken,
      body: loginRes.body as { user: { id: string } },
    };
  }

  async function createAdminToken() {
    const userModel = app.get<Model<User>>(getModelToken(User.name));
    const email = uniqueEmail('admin');
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

  async function giveActiveSubscription(userId: string) {
    const planModel = app.get<Model<Plan>>(getModelToken(Plan.name));
    const subscriptionModel = app.get<Model<Subscription>>(
      getModelToken(Subscription.name),
    );
    const plan = await planModel.create({
      key: `pro-${Date.now()}`,
      audience: PlanAudience.ENTREPRENEUR,
      name: 'Pro',
      priceMonthly: 99,
      priceYearly: 990,
      limits: { maxFavorites: null },
    });
    await subscriptionModel.create({
      userId: new Types.ObjectId(userId),
      planId: plan._id,
      planKey: plan.key,
      status: SubscriptionStatus.ACTIVE,
      billingPeriod: BillingPeriod.MONTHLY,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  }

  it('runs the full intent -> take -> withdraw flow', async () => {
    const adminToken = await createAdminToken();
    const grantRes = await request(app.getHttpServer())
      .post('/admin/grants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Dotacja na cyfryzację testowa',
        description: 'opis',
        type: GrantType.GRANT,
        source: GrantSource.NATIONAL,
        programme: 'FENG',
        institution: 'PARP',
        category: ['cyfryzacja'],
        voivodeships: [],
      })
      .expect(201);
    const grantId = (grantRes.body as { _id: string })._id;

    const company = await registerAndLogin('company');
    await request(app.getHttpServer())
      .post('/companies/me')
      .set('Authorization', `Bearer ${company.token}`)
      .send({
        name: 'ACME Doradztwo',
        contactEmail: company.email,
        specializations: ['cyfryzacja'],
        voivodeshipsServed: [],
      })
      .expect(201);

    const entrepreneur = await registerAndLogin('entrepreneur');
    await giveActiveSubscription(entrepreneur.body.user.id);

    const createRes = await request(app.getHttpServer())
      .post('/applications')
      .set('Authorization', `Bearer ${entrepreneur.token}`)
      .send({ grantId })
      .expect(201);
    const applicationId = (createRes.body as { _id: string })._id;
    expect((createRes.body as { status: string }).status).toBe('intent');

    // Duplicate intent is rejected.
    await request(app.getHttpServer())
      .post('/applications')
      .set('Authorization', `Bearer ${entrepreneur.token}`)
      .send({ grantId })
      .expect(409);

    const matchedRes = await request(app.getHttpServer())
      .get('/applications/company/matched')
      .set('Authorization', `Bearer ${company.token}`)
      .expect(200);
    expect(
      (matchedRes.body as { _id: string }[]).some(
        (a) => a._id === applicationId,
      ),
    ).toBe(true);

    const takeRes = await request(app.getHttpServer())
      .patch(`/applications/${applicationId}/take`)
      .set('Authorization', `Bearer ${company.token}`)
      .expect(200);
    expect((takeRes.body as { status: string }).status).toBe('matched');

    // Taking it again fails - already matched.
    await request(app.getHttpServer())
      .patch(`/applications/${applicationId}/take`)
      .set('Authorization', `Bearer ${company.token}`)
      .expect(409);

    const withdrawRes = await request(app.getHttpServer())
      .patch(`/applications/${applicationId}/withdraw`)
      .set('Authorization', `Bearer ${entrepreneur.token}`)
      .expect(200);
    expect((withdrawRes.body as { status: string }).status).toBe('withdrawn');
  });

  it('rejects applications without an active subscription (paywall)', async () => {
    const entrepreneur = await registerAndLogin('entrepreneur');
    await request(app.getHttpServer())
      .post('/applications')
      .set('Authorization', `Bearer ${entrepreneur.token}`)
      .send({ grantId: '507f1f77bcf86cd799439011' })
      .expect(403);
  });

  it('rejects applications from company accounts', async () => {
    const company = await registerAndLogin('company');
    await request(app.getHttpServer())
      .post('/applications')
      .set('Authorization', `Bearer ${company.token}`)
      .send({ grantId: '507f1f77bcf86cd799439011' })
      .expect(403);
  });

  it('rejects taking an application for non-company accounts', async () => {
    const entrepreneur = await registerAndLogin('entrepreneur');
    await request(app.getHttpServer())
      .patch('/applications/507f1f77bcf86cd799439011/take')
      .set('Authorization', `Bearer ${entrepreneur.token}`)
      .expect(403);
  });

  it('requires authentication for all application endpoints', async () => {
    await request(app.getHttpServer()).get('/applications/me').expect(401);
  });
});
