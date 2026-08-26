import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { REFRESH_TOKEN_COOKIE } from './auth.constants';
import { AuthService, toPublicUser } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { parseDurationMs } from './duration.util';
import type {
  AuthenticatedRefreshUser,
  AuthenticatedUser,
} from './types/jwt-payload.interface';
import { UsersService } from '../users/users.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.authService.register(dto);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { user: toPublicUser(user), accessToken: tokens.accessToken };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    const tokens = await this.authService.login(user);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { user: toPublicUser(user), accessToken: tokens.accessToken };
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @CurrentUser() user: AuthenticatedRefreshUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.refreshTokens(
      user.userId,
      user.refreshToken,
    );
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.userId);
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/auth/refresh' });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() authUser: AuthenticatedUser) {
    const user = await this.usersService.findById(authUser.userId);
    return user ? toPublicUser(user) : null;
  }

  private setRefreshCookie(res: Response, refreshToken: string): void {
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/auth/refresh',
      maxAge: parseDurationMs(
        this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
      ),
    });
  }
}
