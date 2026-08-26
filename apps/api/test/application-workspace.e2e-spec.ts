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

describe('Application workspace (e2e)', () => {
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

  async function setupMatchedApplication() {
    const adminToken = await createAdminToken();
    const grantRes = await request(app.getHttpServer())
      .post('/admin/grants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: `Dotacja workspace ${Date.now()}`,
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

    await request(app.getHttpServer())
      .patch(`/applications/${applicationId}/take`)
      .set('Authorization', `Bearer ${company.token}`)
      .expect(200);

    return { applicationId, entrepreneur, company };
  }

  it('lets the company add a timeline item and the user mark it done', async () => {
    const { applicationId, entrepreneur, company } =
      await setupMatchedApplication();

    const createRes = await request(app.getHttpServer())
      .post(`/applications/${applicationId}/timeline`)
      .set('Authorization', `Bearer ${company.token}`)
      .send({
        title: 'Dostarczyć zaświadczenie o niezaleganiu z ZUS',
        assignedTo: 'user',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      })
      .expect(201);
    const timelineItemId = (createRes.body as { timeline: { _id: string }[] })
      .timeline[0]._id;

    const updateRes = await request(app.getHttpServer())
      .patch(`/applications/${applicationId}/timeline/${timelineItemId}`)
      .set('Authorization', `Bearer ${entrepreneur.token}`)
      .send({ status: 'done' })
      .expect(200);
    expect(
      (updateRes.body as { timeline: { status: string }[] }).timeline[0].status,
    ).toBe('done');
  });

  it('lets both parties exchange messages', async () => {
    const { applicationId, entrepreneur, company } =
      await setupMatchedApplication();

    await request(app.getHttpServer())
      .post(`/applications/${applicationId}/messages`)
      .set('Authorization', `Bearer ${entrepreneur.token}`)
      .send({ content: 'Dzień dobry, mam pytanie odnośnie dokumentów.' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post(`/applications/${applicationId}/messages`)
      .set('Authorization', `Bearer ${company.token}`)
      .send({ content: 'Dzień dobry, oczywiście, służę pomocą.' })
      .expect(201);

    const messages = (res.body as { messages: { senderRole: string }[] })
      .messages;
    expect(messages).toHaveLength(2);
    expect(messages[0].senderRole).toBe('user');
    expect(messages[1].senderRole).toBe('company');
  });

  it('generates a presigned upload URL and registers the document', async () => {
    const { applicationId, entrepreneur } = await setupMatchedApplication();

    const uploadUrlRes = await request(app.getHttpServer())
      .post(`/applications/${applicationId}/documents/upload-url`)
      .set('Authorization', `Bearer ${entrepreneur.token}`)
      .send({
        fileName: 'wniosek.pdf',
        contentType: 'application/pdf',
        category: 'wniosek',
      })
      .expect(201);
    const { uploadUrl, key } = uploadUrlRes.body as {
      uploadUrl: string;
      key: string;
    };
    expect(uploadUrl).toContain('https://');
    expect(key).toContain(`applications/${applicationId}/wniosek/`);

    const registerRes = await request(app.getHttpServer())
      .post(`/applications/${applicationId}/documents`)
      .set('Authorization', `Bearer ${entrepreneur.token}`)
      .send({ fileName: 'wniosek.pdf', key, category: 'wniosek' })
      .expect(201);
    const documents = (registerRes.body as { documents: { version: number }[] })
      .documents;
    expect(documents).toHaveLength(1);
    expect(documents[0].version).toBe(1);
  });

  it('denies access to a third party who is neither owner nor assigned company', async () => {
    const { applicationId } = await setupMatchedApplication();
    const stranger = await registerAndLogin('entrepreneur');

    await request(app.getHttpServer())
      .get(`/applications/${applicationId}`)
      .set('Authorization', `Bearer ${stranger.token}`)
      .expect(403);
  });
});
