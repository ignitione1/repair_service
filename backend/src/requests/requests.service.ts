import { Injectable } from '@nestjs/common';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma/prisma.service';
import type { CreateRequestDto } from './dto/create-request.dto';
import type { AssignRequestDto } from './dto/assign-request.dto';
import type { ListRequestsQuery } from './dto/list-requests.query';
import type { MeRequestsQuery } from './dto/me-requests.query';

type UserRole = 'dispatcher' | 'master';

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateRequestDto) {
    return this.prisma.request.create({
      data: {
        clientName: dto.clientName,
        phone: dto.phone,
        address: dto.address,
        problemText: dto.problemText,
        status: 'new',
      },
    });
  }

  listAll(params: ListRequestsQuery) {
    return this.prisma.request.findMany({
      where: {
        status: params.status,
      },
      orderBy: { createdAt: 'desc' },
      include: { assignedTo: { select: { id: true, name: true, role: true } } },
    });
  }

  async assign(
    requestId: string,
    dto: AssignRequestDto,
    actor: { id: string; role: UserRole },
  ) {
    if (actor.role !== 'dispatcher') {
      throw new ForbiddenException('Недостаточно прав');
    }

    const master = await this.prisma.user.findUnique({
      where: { id: dto.masterId },
      select: { id: true, role: true },
    });
    if (!master) {
      throw new BadRequestException('Мастер не найден');
    }
    if (master.role !== 'master') {
      throw new BadRequestException('Неверная роль пользователя');
    }

    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }
    if (request.status !== 'new') {
      throw new ConflictException('Заявку можно назначить только из статуса new');
    }

    return this.prisma.request.update({
      where: { id: requestId },
      data: {
        status: 'assigned',
        assignedToId: dto.masterId,
      },
      include: { assignedTo: { select: { id: true, name: true, role: true } } },
    });
  }

  async cancel(requestId: string, actor: { id: string; role: UserRole }) {
    if (actor.role !== 'dispatcher') {
      throw new ForbiddenException('Недостаточно прав');
    }

    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }

    if (request.status !== 'new' && request.status !== 'assigned') {
      throw new ConflictException(
        'Отменить заявку можно только из статусов new или assigned',
      );
    }

    return this.prisma.request.update({
      where: { id: requestId },
      data: { status: 'canceled' },
    });
  }

  listForMaster(userId: string, params: MeRequestsQuery) {
    return this.prisma.request.findMany({
      where: {
        assignedToId: userId,
        status: params.status,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async take(requestId: string, actor: { id: string; role: UserRole }) {
    if (actor.role !== 'master') {
      throw new ForbiddenException('Недостаточно прав');
    }

    const now = new Date();
    const res = await this.prisma.request.updateMany({
      where: {
        id: requestId,
        status: 'assigned',
        assignedToId: actor.id,
      },
      data: {
        status: 'in_progress',
        takenAt: now,
      },
    });

    if (res.count !== 1) {
      const current = await this.prisma.request.findUnique({
        where: { id: requestId },
        select: { status: true, assignedToId: true },
      });
      if (!current) {
        throw new NotFoundException('Заявка не найдена');
      }

      if (current.assignedToId !== actor.id) {
        throw new ForbiddenException('Заявка назначена на другого мастера');
      }

      throw new ConflictException('Заявка уже взята в работу');
    }

    return this.prisma.request.findUnique({
      where: { id: requestId },
    });
  }

  async done(requestId: string, actor: { id: string; role: UserRole }) {
    if (actor.role !== 'master') {
      throw new ForbiddenException('Недостаточно прав');
    }

    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }

    if (request.assignedToId !== actor.id) {
      throw new ForbiddenException('Заявка назначена на другого мастера');
    }

    if (request.status !== 'in_progress') {
      throw new ConflictException(
        'Завершить можно только заявку в статусе in_progress',
      );
    }

    return this.prisma.request.update({
      where: { id: requestId },
      data: { status: 'done' },
    });
  }
}
