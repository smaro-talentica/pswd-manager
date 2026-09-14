import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { ACCESS_COOKIE } from './cookies.js';
import { TokenService } from './tokens.js';

export type AuthedRequest = Request & { userId?: string };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const token = request.cookies?.[ACCESS_COOKIE];
    if (typeof token !== 'string' || token.length === 0) {
      throw new UnauthorizedException();
    }
    request.userId = await this.tokens.verifyAccess(token);
    return true;
  }
}
