import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { AddTemplateFieldDto } from './dto/add-template-field.dto.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';
import { TemplatesService } from './templates.service.js';

@Controller('templates')
@UseGuards(AuthGuard)
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.templates.list(userId);
  }

  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: CreateTemplateDto) {
    return this.templates.create(userId, dto);
  }

  @Patch(':id')
  update(@CurrentUserId() userId: string, @Param('id') id: string, @Body() dto: CreateTemplateDto) {
    return this.templates.update(userId, id, dto);
  }

  @Post(':id/fields')
  addField(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: AddTemplateFieldDto,
  ) {
    return this.templates.addField(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.templates.remove(userId, id);
  }
}
