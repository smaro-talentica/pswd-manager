import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignJWT, jwtVerify } from 'jose';

const ACCESS_TYP = 'access';
const REFRESH_TYP = 'refresh';
const TWO_FACTOR_TYP = '2fa';

@Injectable()
export class TokenService {
  constructor(private readonly config: ConfigService) {}

  async signAccess(userId: string): Promise<string> {
    return this.sign(userId, ACCESS_TYP, '15m');
  }

  async signRefresh(userId: string): Promise<string> {
    return this.sign(userId, REFRESH_TYP, '7d');
  }

  async signTwoFactor(userId: string): Promise<string> {
    return this.sign(userId, TWO_FACTOR_TYP, '5m');
  }

  async verifyAccess(token: string): Promise<string> {
    return this.verify(token, ACCESS_TYP);
  }

  async verifyRefresh(token: string): Promise<string> {
    return this.verify(token, REFRESH_TYP);
  }

  async verifyTwoFactor(token: string): Promise<string> {
    return this.verify(token, TWO_FACTOR_TYP);
  }

  private accessSecret(): Uint8Array {
    return new TextEncoder().encode(this.config.getOrThrow<string>('JWT_ACCESS_SECRET'));
  }

  private refreshSecret(): Uint8Array {
    return new TextEncoder().encode(this.config.getOrThrow<string>('JWT_REFRESH_SECRET'));
  }

  private async sign(userId: string, typ: string, expiresIn: string): Promise<string> {
    const secret = typ === REFRESH_TYP ? this.refreshSecret() : this.accessSecret();
    return new SignJWT({ typ })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(secret);
  }

  private async verify(token: string, expectedTyp: string): Promise<string> {
    const secret =
      expectedTyp === REFRESH_TYP
        ? this.refreshSecret()
        : this.accessSecret();
    try {
      const { payload } = await jwtVerify(token, secret);
      if (payload.typ !== expectedTyp || typeof payload.sub !== 'string') {
        throw new UnauthorizedException();
      }
      return payload.sub;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
