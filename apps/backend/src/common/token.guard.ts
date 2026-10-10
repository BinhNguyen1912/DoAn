import { timingSafeEqual } from 'node:crypto';
import { type CanActivate, type ExecutionContext, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AppConfigService } from '../config/app-config.service.js';

export type TokenKind = 'edge' | 'device';
const TOKEN_KIND = 'token-kind';

/** Require `Authorization: Bearer <token>` of the given kind on a route. */
export const RequireToken = (kind: TokenKind) => SetMetadata(TOKEN_KIND, kind);

const safeEqual = (a: string, b: string): boolean => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

@Injectable()
export class TokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: AppConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const kind = this.reflector.getAllAndOverride<TokenKind | undefined>(TOKEN_KIND, [context.getHandler(), context.getClass()]);
    if (!kind) return true;
    const header = context.switchToHttp().getRequest<Request>().headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    const expected = this.config.get(kind === 'edge' ? 'EDGE_API_TOKEN' : 'DEVICE_API_TOKEN');
    if (scheme !== 'Bearer' || !token || !safeEqual(token, expected)) {
      throw new UnauthorizedException('Invalid or missing token');
    }
    return true;
  }
}
