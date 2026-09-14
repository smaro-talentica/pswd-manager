import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  STANDARD_TEMPLATES,
  builtInTemplateRows,
  newField,
  parseTemplateSchema,
  type TemplateSchema,
} from './builtin.js';
import type { AddTemplateFieldDto } from './dto/add-template-field.dto.js';
import type { CreateTemplateDto } from './dto/create-template.dto.js';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    await this.ensureBuiltIns(userId);
    const templates = await this.prisma.template.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return templates
      .map((template) => this.serialize(template))
      .sort((left, right) => {
        if (left.builtIn !== right.builtIn) {
          return left.builtIn ? -1 : 1;
        }
        return left.name.localeCompare(right.name);
      });
  }

  async create(userId: string, dto: CreateTemplateDto) {
    await this.ensureBuiltIns(userId);
    const schema: TemplateSchema = {
      builtIn: false,
      itemType: 'CUSTOM',
      fields: dto.fields.map((field) => newField(field.label, field.input ?? 'text')),
    };
    const template = await this.prisma.template.create({
      data: {
        userId,
        name: dto.name.trim(),
        schema: schema as unknown as Prisma.InputJsonValue,
      },
    });
    return this.serialize(template);
  }

  async update(userId: string, templateId: string, dto: CreateTemplateDto) {
    const template = await this.prisma.template.findFirst({
      where: { id: templateId, userId },
    });
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    const schema = parseTemplateSchema(template.schema);
    if (schema.builtIn) {
      throw new ForbiddenException('Standard templates cannot be changed');
    }
    schema.fields = dto.fields.map((field, index) => {
      const previous = schema.fields[index];
      if (previous) {
        return {
          ...previous,
          label: field.label.trim(),
          input: field.input ?? previous.input,
        };
      }
      return newField(field.label, field.input ?? 'text');
    });
    const updated = await this.prisma.template.update({
      where: { id: template.id },
      data: {
        name: dto.name.trim(),
        schema: schema as unknown as Prisma.InputJsonValue,
      },
    });
    return this.serialize(updated);
  }

  async addField(userId: string, templateId: string, dto: AddTemplateFieldDto) {
    const template = await this.prisma.template.findFirst({
      where: { id: templateId, userId },
    });
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    const schema = parseTemplateSchema(template.schema);
    if (schema.builtIn) {
      throw new ForbiddenException('Standard templates cannot be changed');
    }
    schema.fields.push(newField(dto.label, dto.input ?? 'text'));
    const updated = await this.prisma.template.update({
      where: { id: template.id },
      data: { schema: schema as unknown as Prisma.InputJsonValue },
    });
    return this.serialize(updated);
  }

  async remove(userId: string, templateId: string) {
    const template = await this.prisma.template.findFirst({
      where: { id: templateId, userId },
    });
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    if (parseTemplateSchema(template.schema).builtIn) {
      throw new ForbiddenException('Standard templates cannot be deleted');
    }
    await this.prisma.template.delete({ where: { id: template.id } });
  }

  private async ensureBuiltIns(userId: string) {
    const existing = await this.prisma.template.findMany({ where: { userId } });
    if (existing.length === 0) {
      await this.prisma.template.createMany({
        data: builtInTemplateRows(userId),
      });
      return;
    }

    for (const standard of STANDARD_TEMPLATES) {
      const match = existing.find((template) => {
        const schema = parseTemplateSchema(template.schema);
        return schema.builtIn && schema.itemType === standard.itemType;
      });
      const schema: TemplateSchema = {
        builtIn: true,
        itemType: standard.itemType,
        fields: standard.fields,
      };
      if (match) {
        const current = parseTemplateSchema(match.schema);
        const sameFields =
          current.fields.length === standard.fields.length &&
          current.fields.every(
            (field, index) =>
              field.id === standard.fields[index]?.id &&
              field.label === standard.fields[index]?.label &&
              field.input === standard.fields[index]?.input,
          );
        if (match.name !== standard.name || !sameFields) {
          await this.prisma.template.update({
            where: { id: match.id },
            data: {
              name: standard.name,
              schema: schema as unknown as Prisma.InputJsonValue,
            },
          });
        }
      } else {
        await this.prisma.template.create({
          data: {
            userId,
            name: standard.name,
            schema: schema as unknown as Prisma.InputJsonValue,
          },
        });
      }
    }
  }

  private serialize(template: { id: string; name: string; schema: Prisma.JsonValue; createdAt: Date }) {
    const schema = parseTemplateSchema(template.schema);
    return {
      id: template.id,
      name: template.name,
      builtIn: schema.builtIn,
      itemType: schema.itemType,
      fields: schema.fields,
      createdAt: template.createdAt.toISOString(),
    };
  }
}
