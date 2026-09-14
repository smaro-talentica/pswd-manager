import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/configure-app.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

const password = 'Test123!';

function registerBody(email: string) {
  return {
    email,
    password,
    kdfSalt: Buffer.alloc(16, 1).toString('base64'),
    kdfParams: {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations: 600000,
      length: 256,
    },
    publicKey: Buffer.alloc(65, 2).toString('base64'),
    encryptedPrivateKey: Buffer.alloc(48, 3).toString('base64'),
    encryptedDek: Buffer.alloc(48, 4).toString('base64'),
  };
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const createdEmails: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (createdEmails.length > 0) {
      await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
    }
    await app.close();
  });

  it('registers, reads me, and logs out', async () => {
    const email = `auth-${Date.now()}@example.com`;
    createdEmails.push(email);
    const agent = request.agent(app.getHttpServer());

    const registered = await agent.post('/api/auth/register').send(registerBody(email)).expect(201);

    expect(registered.body.user.email).toBe(email);
    expect(registered.body.user).not.toHaveProperty('passwordHash');
    expect(registered.body.crypto.kdfSalt).toBeDefined();
    expect(registered.body.crypto.vaults).toHaveLength(1);

    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body).toEqual({ id: registered.body.user.id, email });

    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/auth/me').expect(401);
  });

  it('logs in with email and master password', async () => {
    const email = `login-${Date.now()}@example.com`;
    createdEmails.push(email);
    const agent = request.agent(app.getHttpServer());

    await agent.post('/api/auth/register').send(registerBody(email)).expect(201);
    await agent.post('/api/auth/logout').expect(204);

    const loggedIn = await agent
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    expect(loggedIn.body.user.email).toBe(email);
    await agent.get('/api/auth/crypto').expect(200);
  });

  it('rejects a duplicate email', async () => {
    const email = `dup-${Date.now()}@example.com`;
    createdEmails.push(email);
    const server = app.getHttpServer();
    await request(server).post('/api/auth/register').send(registerBody(email)).expect(201);
    await request(server).post('/api/auth/register').send(registerBody(email)).expect(409);
  });
});
