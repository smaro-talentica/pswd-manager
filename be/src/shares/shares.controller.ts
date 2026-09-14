import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { CreateShareDto } from './dto/create-share.dto.js';
import { SharesService } from './shares.service.js';

@Controller()
@UseGuards(AuthGuard)
export class SharesController {
  constructor(private readonly shares: SharesService) {}

  @Get('users/lookup')
  lookup(@Query('email') email: string) {
    return this.shares.lookup(email ?? '');
  }

  @Get('shares/received')
  received(@CurrentUserId() userId: string) {
    return this.shares.listReceived(userId);
  }

  @Post('shares')
  create(@CurrentUserId() userId: string, @Body() dto: CreateShareDto) {
    return this.shares.create(userId, dto);
  }

  @Delete('shares/:id')
  @HttpCode(204)
  revoke(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.shares.revoke(userId, id);
  }
}
