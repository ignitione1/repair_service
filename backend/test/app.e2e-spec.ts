import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../src/prisma/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    await prisma.request.deleteMany();
    await prisma.user.deleteMany();
  });

  it('race: take должен быть атомарным (один 201/200, второй 409)', async () => {
    const passwordHashDispatcher = await bcrypt.hash('dispatcher123', 10);
    const passwordHashMaster = await bcrypt.hash('master123', 10);

    await prisma.user.create({
      data: {
        name: 'dispatcher',
        passwordHash: passwordHashDispatcher,
        role: 'dispatcher',
      },
    });

    const master = await prisma.user.create({
      data: {
        name: 'master1',
        passwordHash: passwordHashMaster,
        role: 'master',
      },
    });

    const req = await prisma.request.create({
      data: {
        clientName: 'Иван',
        phone: '+70000000001',
        address: 'ул. Ленина, 1',
        problemText: 'Не работает розетка',
        status: 'assigned',
        assignedToId: master.id,
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ name: 'master1', password: 'master123' })
      .expect(201);

    const token = loginRes.body.accessToken as string;

    const p1 = request(app.getHttpServer())
      .post(`/requests/${req.id}/take`)
      .set('Authorization', `Bearer ${token}`);
    const p2 = request(app.getHttpServer())
      .post(`/requests/${req.id}/take`)
      .set('Authorization', `Bearer ${token}`);

    const [r1, r2] = await Promise.all([p1, p2]);
    const statuses = [r1.status, r2.status].sort();

    expect(statuses).toEqual([201, 409]);

    const updated = await prisma.request.findUnique({ where: { id: req.id } });
    expect(updated?.status).toBe('in_progress');
  });

  it('dispatcher: cancel из in_progress должен возвращать 409', async () => {
    const passwordHashDispatcher = await bcrypt.hash('dispatcher123', 10);
    const passwordHashMaster = await bcrypt.hash('master123', 10);

    const dispatcher = await prisma.user.create({
      data: {
        name: 'dispatcher',
        passwordHash: passwordHashDispatcher,
        role: 'dispatcher',
      },
    });
    void dispatcher;

    const master = await prisma.user.create({
      data: {
        name: 'master1',
        passwordHash: passwordHashMaster,
        role: 'master',
      },
    });

    const req = await prisma.request.create({
      data: {
        clientName: 'Петр',
        phone: '+70000000002',
        address: 'ул. Мира, 10',
        problemText: 'Протечка крана',
        status: 'in_progress',
        assignedToId: master.id,
        takenAt: new Date(),
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ name: 'dispatcher', password: 'dispatcher123' })
      .expect(201);

    const token = loginRes.body.accessToken as string;

    await request(app.getHttpServer())
      .post(`/requests/${req.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .expect(409);
  });
});
