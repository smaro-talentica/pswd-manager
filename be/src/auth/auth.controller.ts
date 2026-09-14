import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import {
  clearSessionCookies,
  REFRESH_COOKIE,
  setSessionCookies,
  setTwoFactorCookie,
  TWO_FACTOR_COOKIE,
} from './cookies.js';
import { CurrentUserId } from './current-user.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { TotpCodeDto } from './dto/totp-code.dto.js';
import { TokenService } from './tokens.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: TokenService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.register(dto);
    await this.attachSession(response, result.user.id);
    return result;
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const outcome = await this.auth.login(dto);
    if (outcome.kind === 'totp') {
      clearSessionCookies(response);
      setTwoFactorCookie(response, await this.tokens.signTwoFactor(outcome.userId));
      return { twoFactorRequired: true };
    }
    await this.attachSession(response, outcome.result.user.id);
    return outcome.result;
  }

  @Post('2fa/verify-login')
  @HttpCode(200)
  async verifyLogin(@Body() dto: TotpCodeDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const pending = request.cookies?.[TWO_FACTOR_COOKIE];
    if (typeof pending !== 'string' || pending.length === 0) {
      throw new UnauthorizedException('Sign in with your password first');
    }
    const userId = await this.tokens.verifyTwoFactor(pending);
    const result = await this.auth.completeTwoFactorLogin(userId, dto.code);
    await this.attachSession(response, result.user.id);
    return result;
  }

  @Post('2fa/setup')
  @UseGuards(AuthGuard)
  setupTwoFactor(@CurrentUserId() userId: string) {
    return this.auth.setupTwoFactor(userId);
  }

  @Post('2fa/enable')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  enableTwoFactor(@CurrentUserId() userId: string, @Body() dto: TotpCodeDto) {
    return this.auth.enableTwoFactor(userId, dto.code);
  }

  @Post('2fa/disable')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  disableTwoFactor(@CurrentUserId() userId: string, @Body() dto: TotpCodeDto) {
    return this.auth.disableTwoFactor(userId, dto.code);
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: Response): void {
    clearSessionCookies(response);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refresh = request.cookies?.[REFRESH_COOKIE];
    if (typeof refresh !== 'string' || refresh.length === 0) {
      clearSessionCookies(response);
      throw new UnauthorizedException();
    }
    const userId = await this.tokens.verifyRefresh(refresh);
    await this.attachSession(response, userId);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUserId() userId: string) {
    return this.auth.me(userId);
  }

  @Get('crypto')
  @UseGuards(AuthGuard)
  crypto(@CurrentUserId() userId: string) {
    return this.auth.crypto(userId);
  }

  private async attachSession(response: Response, userId: string): Promise<void> {
    const [access, refresh] = await Promise.all([
      this.tokens.signAccess(userId),
      this.tokens.signRefresh(userId),
    ]);
    setSessionCookies(response, { access, refresh });
  }
}
