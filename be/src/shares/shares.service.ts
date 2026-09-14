import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ItemsService } from '../items/items.service.js';
import type { CreateShareDto } from './dto/create-share.dto.js';

@Injectable()
export class SharesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly items: ItemsService,
  ) {}

  async lookup(rawEmail: string) {
    const email = (rawEmail ?? '').trim().toLowerCase();
    if (!email) {
      throw new NotFoundException(
        'This user does not exist on our platform. Ask them to create an account.',
      );
    }
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, publicKey: true },
    });
    if (!user) {
      throw new NotFoundException(
        'This user does not exist on our platform. Ask them to create an account.',
      );
    }
    return {
      id: user.id,
      email: user.email,
      publicKey: Buffer.from(user.publicKey).toString('base64'),
    };
  }

  async create(fromUserId: string, dto: CreateShareDto) {
    const item = await this.items.requireOwned(fromUserId, dto.itemId);
    const recipient = await this.lookup(dto.email);
    if (recipient.id === fromUserId) {
      throw new BadRequestException('You cannot share a secret with yourself');
    }

    try {
      const share = await this.prisma.share.create({
        data: {
          itemId: item.id,
          fromUserId,
          toUserId: recipient.id,
          wrappedKey: Buffer.from(dto.wrappedKey, 'base64'),
        },
        include: { toUser: { select: { id: true, email: true } } },
      });
      return {
        id: share.id,
        email: share.toUser.email,
        userId: share.toUser.id,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Already shared with this user');
      }
      throw error;
    }
  }

  async revoke(fromUserId: string, shareId: string) {
    const share = await this.prisma.share.findFirst({
      where: { id: shareId, fromUserId },
    });
    if (!share) {
      throw new NotFoundException('Share not found');
    }
    await this.prisma.share.delete({ where: { id: shareId } });
  }

  async listReceived(userId: string) {
    const shares = await this.prisma.share.findMany({
      where: { toUserId: userId },
      include: {
        item: true,
        fromUser: { select: { id: true, email: true, publicKey: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return shares.map((share) => ({
      shareId: share.id,
      fromEmail: share.fromUser.email,
      fromPublicKey: Buffer.from(share.fromUser.publicKey).toString('base64'),
      wrappedKey: Buffer.from(share.wrappedKey).toString('base64'),
      item: {
        id: share.item.id,
        vaultId: share.item.vaultId,
        type: share.item.type,
        encryptedPayload: Buffer.from(share.item.encryptedPayload).toString('base64'),
        nonce: Buffer.from(share.item.nonce).toString('base64'),
        createdAt: share.item.createdAt.toISOString(),
      },
    }));
  }
}
