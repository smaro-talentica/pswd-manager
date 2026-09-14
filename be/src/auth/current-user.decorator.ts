import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AuthedRequest } from './auth.guard.js';

export const CurrentUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<AuthedRequest>();
  if (!request.userId) {
    throw new UnauthorizedException();
  }
  return request.userId;
});
