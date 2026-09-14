import type { CookieOptions, Response } from 'express';

export const ACCESS_COOKIE = 'pm_access';
export const REFRESH_COOKIE = 'pm_refresh';
export const TWO_FACTOR_COOKIE = 'pm_2fa';

export const ACCESS_MAX_AGE_MS = 15 * 60 * 1000;
export const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const TWO_FACTOR_MAX_AGE_MS = 5 * 60 * 1000;

function cookieBase(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'test',
    sameSite: 'lax',
    path: '/',
  };
}

export function setSessionCookies(
  response: Response,
  tokens: { access: string; refresh: string },
): void {
  const base = cookieBase();
  response.cookie(ACCESS_COOKIE, tokens.access, {
    ...base,
    maxAge: ACCESS_MAX_AGE_MS,
  });
  response.cookie(REFRESH_COOKIE, tokens.refresh, {
    ...base,
    maxAge: REFRESH_MAX_AGE_MS,
  });
  response.clearCookie(TWO_FACTOR_COOKIE, base);
}

export function setTwoFactorCookie(response: Response, token: string): void {
  response.cookie(TWO_FACTOR_COOKIE, token, {
    ...cookieBase(),
    maxAge: TWO_FACTOR_MAX_AGE_MS,
  });
}

export function clearSessionCookies(response: Response): void {
  const base = cookieBase();
  response.clearCookie(ACCESS_COOKIE, base);
  response.clearCookie(REFRESH_COOKIE, base);
  response.clearCookie(TWO_FACTOR_COOKIE, base);
}
