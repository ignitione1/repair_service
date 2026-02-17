import 'dotenv/config';
import { createRequire } from 'module';
import * as bcrypt from 'bcrypt';

const localRequire = createRequire(__filename);
const { PrismaClient } = localRequire('@prisma/client') as {
  PrismaClient: new (opts: unknown) => any;
};
const { PrismaBetterSqlite3 } = localRequire(
  '@prisma/adapter-better-sqlite3',
) as {
  PrismaBetterSqlite3: new (params: { url: string }) => unknown;
};

const databaseUrl = process.env.DATABASE_URL ?? 'file:./dev.db';
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });

const prisma = new PrismaClient({
  adapter,
  log: ['error'],
});

async function main() {
  const passwordDispatcher = await bcrypt.hash('dispatcher123', 10);
  const passwordMaster1 = await bcrypt.hash('master123', 10);
  const passwordMaster2 = await bcrypt.hash('master123', 10);

  const dispatcher = await prisma.user.upsert({
    where: { name: 'dispatcher' },
    update: {
      passwordHash: passwordDispatcher,
      role: 'dispatcher',
    },
    create: {
      name: 'dispatcher',
      passwordHash: passwordDispatcher,
      role: 'dispatcher',
    },
  });

  const master1 = await prisma.user.upsert({
    where: { name: 'master1' },
    update: {
      passwordHash: passwordMaster1,
      role: 'master',
    },
    create: {
      name: 'master1',
      passwordHash: passwordMaster1,
      role: 'master',
    },
  });

  const master2 = await prisma.user.upsert({
    where: { name: 'master2' },
    update: {
      passwordHash: passwordMaster2,
      role: 'master',
    },
    create: {
      name: 'master2',
      passwordHash: passwordMaster2,
      role: 'master',
    },
  });

  await prisma.request.deleteMany();

  await prisma.request.createMany({
    data: [
      {
        clientName: 'Иван',
        phone: '+70000000001',
        address: 'ул. Ленина, 1',
        problemText: 'Не работает розетка',
        status: 'new',
      },
      {
        clientName: 'Петр',
        phone: '+70000000002',
        address: 'ул. Мира, 10',
        problemText: 'Протечка крана',
        status: 'assigned',
        assignedToId: master1.id,
      },
      {
        clientName: 'Анна',
        phone: '+70000000003',
        address: 'пр. Победы, 5',
        problemText: 'Сломалась дверь',
        status: 'assigned',
        assignedToId: master2.id,
      },
      {
        clientName: 'Мария',
        phone: '+70000000004',
        address: 'ул. Садовая, 7',
        problemText: 'Не греет батарея',
        status: 'in_progress',
        assignedToId: master1.id,
        takenAt: new Date(),
      },
      {
        clientName: 'Олег',
        phone: '+70000000005',
        address: 'ул. Центральная, 3',
        problemText: 'Шумит кондиционер',
        status: 'done',
        assignedToId: master2.id,
        takenAt: new Date(),
      },
      {
        clientName: 'Сергей',
        phone: '+70000000006',
        address: 'ул. Парковая, 9',
        problemText: 'Сломался замок',
        status: 'canceled',
        assignedToId: master2.id,
      },
    ],
  });

  void dispatcher;
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
