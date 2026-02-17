import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { AssignRequestDto } from './dto/assign-request.dto';
import { ListRequestsQuery } from './dto/list-requests.query';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/jwt.strategy';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  create(@Body() dto: CreateRequestDto) {
    return this.requestsService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('dispatcher')
  @Get()
  listAll(@Query() query: ListRequestsQuery) {
    return this.requestsService.listAll(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('dispatcher')
  @Post(':id/assign')
  assign(
    @Param('id') id: string,
    @Body() dto: AssignRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.requestsService.assign(id, dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('dispatcher')
  @Post(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.requestsService.cancel(id, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master')
  @Post(':id/take')
  take(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.requestsService.take(id, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master')
  @Post(':id/done')
  done(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.requestsService.done(id, user);
  }
}
