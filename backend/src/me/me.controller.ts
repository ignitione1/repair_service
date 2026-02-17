import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/jwt.strategy';
import { RequestsService } from '../requests/requests.service';
import { MeRequestsQuery } from '../requests/dto/me-requests.query';

@Controller('me')
export class MeController {
  constructor(private readonly requestsService: RequestsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master')
  @Get('requests')
  listMyRequests(@CurrentUser() user: AuthUser, @Query() query: MeRequestsQuery) {
    return this.requestsService.listForMaster(user.id, query);
  }
}
