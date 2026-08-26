import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import {
  AuthenticatedRefreshUser,
  JwtPayload,
} from '../types/jwt-payload.interface';
import { REFRESH_TOKEN_COOKIE } from '../auth.constants';

function extractRefreshTokenFromCookie(req: Request): string | null {
  const token: unknown = req.cookies?.[REFRESH_TOKEN_COOKIE];
  return typeof token === 'string' ? token : null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: extractRefreshTokenFromCookie,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET')!,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): AuthenticatedRefreshUser {
    const refreshToken = extractRefreshTokenFromCookie(req);
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      refreshToken,
    };
  }
}
