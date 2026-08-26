import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Auth (e2e)', () => {
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
    return `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  }

  interface AuthResponseBody {
    accessToken: string;
    user: { email: string };
  }

  it('registers, logs in, refreshes and logs out', async () => {
    const email = uniqueEmail();
    const password = 'a-strong-password';

    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);
    const registerBody = registerRes.body as AuthResponseBody;

    expect(registerBody.accessToken).toBeDefined();
    expect(registerBody.user.email).toBe(email);
    const registerCookie = registerRes.headers['set-cookie'];
    expect(registerCookie).toBeDefined();

    const meRes = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${registerBody.accessToken}`)
      .expect(200);
    expect((meRes.body as { email: string }).email).toBe(email);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    const refreshCookie = loginRes.headers['set-cookie'] as unknown as string[];

    const refreshRes = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(200);
    const refreshBody = refreshRes.body as AuthResponseBody;
    expect(refreshBody.accessToken).toBeDefined();
    const rotatedCookie = refreshRes.headers[
      'set-cookie'
    ] as unknown as string[];

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${refreshBody.accessToken}`)
      .set('Cookie', rotatedCookie)
      .expect(204);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', rotatedCookie)
      .expect(401);
  });

  it('rejects registration with a duplicate email', async () => {
    const email = uniqueEmail();
    const password = 'a-strong-password';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(409);
  });

  it('rejects login with wrong credentials', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: uniqueEmail(), password: 'wrong-password' })
      .expect(401);
  });

  it('rejects /auth/me without a token', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });
});
