import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  listAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  findByName(name: string) {
    return this.prisma.user.findUnique({ where: { name } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
