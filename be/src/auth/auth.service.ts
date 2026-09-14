import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import { builtInTemplateRows } from '../templates/builtin.js';
import { generateTotpSecret, totpOtpauthUrl, verifyTotp } from './totp.js';

export type PublicUser = {
  id: string;
  email: string;
  twoFactorEnabled: boolean;
};

export type CryptoPayload = {
  kdfSalt: string;
  kdfParams: Prisma.JsonValue;
  encryptedPrivateKey: string;
  vaults: Array<{ id: string; encryptedDek: string }>;
};

export type AuthResult = {
  user: PublicUser;
  crypto: CryptoPayload;
};

export type LoginOutcome =
  | { kind: 'session'; result: AuthResult }
  | { kind: 'totp'; userId: string };

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            passwordHash,
            kdfSalt: Buffer.from(dto.kdfSalt, 'base64'),
            kdfParams: { ...dto.kdfParams } as Prisma.InputJsonValue,
            publicKey: Buffer.from(dto.publicKey, 'base64'),
            encryptedPrivateKey: Buffer.from(dto.encryptedPrivateKey, 'base64'),
          },
        });
        const vault = await tx.vault.create({
          data: {
            userId: user.id,
            name: 'Personal',
            encryptedDek: Buffer.from(dto.encryptedDek, 'base64'),
          },
        });
        await tx.template.createMany({
          data: builtInTemplateRows(user.id),
        });
        return { user, vault };
      });
      return this.toAuthResult(created.user, [created.vault]);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('An account with that email already exists');
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<LoginOutcome> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { vaults: { select: { id: true, encryptedDek: true } } },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const matches = await argon2.verify(user.passwordHash, dto.password).catch(() => false);
    if (!matches) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.totpEnabled && user.totpSecret) {
      return { kind: 'totp', userId: user.id };
    }
    return { kind: 'session', result: this.toAuthResult(user, user.vaults) };
  }

  async completeTwoFactorLogin(userId: string, code: string): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { vaults: { select: { id: true, encryptedDek: true } } },
    });
    if (!user?.totpEnabled || !user.totpSecret || !verifyTotp(user.totpSecret, code)) {
      throw new UnauthorizedException('Invalid authenticator code');
    }
    return this.toAuthResult(user, user.vaults);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, totpEnabled: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return { id: user.id, email: user.email, twoFactorEnabled: user.totpEnabled };
  }

  async crypto(userId: string): Promise<CryptoPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { vaults: { select: { id: true, encryptedDek: true } } },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.toCrypto(user, user.vaults);
  }

  async setupTwoFactor(userId: string): Promise<{ secret: string; otpauthUrl: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, totpEnabled: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    if (user.totpEnabled) {
      throw new ForbiddenException('Authenticator is already on');
    }
    const secret = generateTotpSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: secret, totpEnabled: false },
    });
    return { secret, otpauthUrl: totpOtpauthUrl(user.email, secret) };
  }

  async enableTwoFactor(userId: string, code: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, totpSecret: true, totpEnabled: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    if (user.totpEnabled) {
      throw new ForbiddenException('Authenticator is already on');
    }
    if (!user.totpSecret || !verifyTotp(user.totpSecret, code)) {
      throw new UnauthorizedException('Invalid authenticator code');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true },
    });
    return { id: user.id, email: user.email, twoFactorEnabled: true };
  }

  async disableTwoFactor(userId: string, code: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, totpSecret: true, totpEnabled: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    if (!user.totpEnabled || !user.totpSecret || !verifyTotp(user.totpSecret, code)) {
      throw new UnauthorizedException('Invalid authenticator code');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: null, totpEnabled: false },
    });
    return { id: user.id, email: user.email, twoFactorEnabled: false };
  }

  private toAuthResult(
    user: {
      id: string;
      email: string;
      totpEnabled?: boolean;
      kdfSalt: Uint8Array;
      kdfParams: Prisma.JsonValue;
      encryptedPrivateKey: Uint8Array;
    },
    vaults: Array<{ id: string; encryptedDek: Uint8Array }>,
  ): AuthResult {
    return {
      user: { id: user.id, email: user.email, twoFactorEnabled: user.totpEnabled === true },
      crypto: this.toCrypto(user, vaults),
    };
  }

  private toCrypto(
    user: { kdfSalt: Uint8Array; kdfParams: Prisma.JsonValue; encryptedPrivateKey: Uint8Array },
    vaults: Array<{ id: string; encryptedDek: Uint8Array }>,
  ): CryptoPayload {
    return {
      kdfSalt: Buffer.from(user.kdfSalt).toString('base64'),
      kdfParams: user.kdfParams,
      encryptedPrivateKey: Buffer.from(user.encryptedPrivateKey).toString('base64'),
      vaults: vaults.map((vault) => ({
        id: vault.id,
        encryptedDek: Buffer.from(vault.encryptedDek).toString('base64'),
      })),
    };
  }
}
