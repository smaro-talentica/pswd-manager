import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { CreateItemDto } from './dto/create-item.dto.js';
import { ItemsService } from './items.service.js';

@Controller('items')
@UseGuards(AuthGuard)
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.items.listMine(userId);
  }

  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: CreateItemDto) {
    return this.items.create(userId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.items.remove(userId, id);
  }
}
