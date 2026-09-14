import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { TokenService } from './tokens.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, TokenService, AuthGuard],
  exports: [AuthGuard, TokenService],
})
export class AuthModule {}
