import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Companies (e2e)', () => {
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

  function uniqueEmail() {
    return `company-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  }

  it('lets a company user create and update their profile', async () => {
    const email = uniqueEmail();
    const password = 'a-strong-password';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, role: 'company' })
      .expect(201);
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    const token = (loginRes.body as { accessToken: string }).accessToken;

    const createRes = await request(app.getHttpServer())
      .post('/companies/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'ACME Doradztwo',
        contactEmail: email,
        voivodeshipsServed: ['mazowieckie'],
        specializations: ['cyfryzacja'],
      })
      .expect(201);
    expect((createRes.body as { name: string }).name).toBe('ACME Doradztwo');

    await request(app.getHttpServer())
      .post('/companies/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Duplicate', contactEmail: email })
      .expect(409);

    const listRes = await request(app.getHttpServer())
      .get('/companies')
      .query({ specialization: 'cyfryzacja' })
      .expect(200);
    const list = listRes.body as { name: string }[];
    expect(list.some((c) => c.name === 'ACME Doradztwo')).toBe(true);

    await request(app.getHttpServer())
      .patch('/companies/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Pomagamy w pozyskiwaniu dotacji' })
      .expect(200);
  });

  it('rejects company profile creation for entrepreneur accounts', async () => {
    const email = uniqueEmail();
    const password = 'a-strong-password';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, role: 'entrepreneur' })
      .expect(201);
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    const token = (loginRes.body as { accessToken: string }).accessToken;

    await request(app.getHttpServer())
      .post('/companies/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X', contactEmail: email })
      .expect(403);
  });
});
