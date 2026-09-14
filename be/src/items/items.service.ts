import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateItemDto } from './dto/create-item.dto.js';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateItemDto) {
    const vault = await this.prisma.vault.findFirst({
      where: { id: dto.vaultId, userId },
    });
    if (!vault) {
      throw new ForbiddenException('Vault not found');
    }

    if (dto.templateId) {
      const template = await this.prisma.template.findFirst({
        where: { id: dto.templateId, userId },
      });
      if (!template) {
        throw new ForbiddenException('Template not found');
      }
    }

    const item = await this.prisma.item.create({
      data: {
        vaultId: dto.vaultId,
        templateId: dto.templateId,
        type: dto.type,
        encryptedPayload: Buffer.from(dto.encryptedPayload, 'base64'),
        nonce: Buffer.from(dto.nonce, 'base64'),
        wrappedDek: Buffer.from(dto.wrappedDek, 'base64'),
      },
    });
    return this.serializeOwned(item, []);
  }

  async listMine(userId: string) {
    const items = await this.prisma.item.findMany({
      where: { vault: { userId } },
      include: {
        shares: {
          include: { toUser: { select: { id: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((item) => this.serializeOwned(item, item.shares));
  }

  async requireOwned(userId: string, itemId: string) {
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, vault: { userId } },
    });
    if (!item) {
      throw new NotFoundException('Secret not found');
    }
    return item;
  }

  async remove(userId: string, itemId: string) {
    await this.requireOwned(userId, itemId);
    await this.prisma.item.delete({ where: { id: itemId } });
  }

  serializeOwned(
    item: {
      id: string;
      vaultId: string;
      templateId: string | null;
      type: string;
      encryptedPayload: Uint8Array;
      nonce: Uint8Array;
      wrappedDek: Uint8Array;
      createdAt: Date;
    },
    shares: Array<{ id: string; toUser: { id: string; email: string } }>,
  ) {
    return {
      id: item.id,
      vaultId: item.vaultId,
      templateId: item.templateId,
      type: item.type,
      encryptedPayload: Buffer.from(item.encryptedPayload).toString('base64'),
      nonce: Buffer.from(item.nonce).toString('base64'),
      wrappedDek: Buffer.from(item.wrappedDek).toString('base64'),
      createdAt: item.createdAt.toISOString(),
      shares: shares.map((share) => ({
        id: share.id,
        email: share.toUser.email,
        userId: share.toUser.id,
      })),
    };
  }
}
