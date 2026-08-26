import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import * as argon2 from 'argon2';
import { Model } from 'mongoose';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GrantSource, GrantType } from '../src/grants/constants';
import { User, UserRole } from '../src/users/schemas/user.schema';

describe('Grants (e2e)', () => {
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

  it('rejects grant creation for anonymous users', async () => {
    await request(app.getHttpServer())
      .post('/admin/grants')
      .send({ title: 'Test' })
      .expect(401);
  });

  it('creates, lists, fetches and deletes a grant as admin', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/admin/grants')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        title: 'Dotacja testowa na cyfryzację',
        description: 'Opis dotacji testowej',
        type: GrantType.GRANT,
        source: GrantSource.NATIONAL,
        programme: 'FENG',
        institution: 'PARP',
        voivodeships: ['mazowieckie'],
        category: ['cyfryzacja'],
        fundingRange: { min: 10000, max: 500000 },
      })
      .expect(201);
    const created = createRes.body as { slug: string; _id: string };
    expect(created.slug).toBe('dotacja-testowa-na-cyfryzacje');

    const listRes = await request(app.getHttpServer())
      .get('/grants')
      .query({ voivodeships: 'mazowieckie', category: 'cyfryzacja' })
      .expect(200);
    const list = listRes.body as { items: { slug: string }[]; total: number };
    expect(list.items.some((g) => g.slug === created.slug)).toBe(true);

    await request(app.getHttpServer())
      .get(`/grants/${created.slug}`)
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/admin/grants/${created._id}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/grants/${created.slug}`)
      .expect(404);
  });

  it('rejects grant creation for non-admin roles', async () => {
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
      .post('/admin/grants')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test' })
      .expect(403);
  });
});
