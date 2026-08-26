import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './types/jwt-payload.interface';

export interface PublicUser {
  id: string;
  email: string;
  role: string;
  companyName?: string;
  nip?: string;
  phone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    companyName: user.companyName,
    nip: user.nip,
    phone: user.phone,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ user: UserDocument; tokens: AuthTokens }> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Konto z tym adresem e-mail już istnieje');
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      role: dto.role,
      companyName: dto.companyName,
      nip: dto.nip,
      phone: dto.phone,
    });

    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  async validateUser(email: string, password: string): Promise<UserDocument> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Nieprawidłowy e-mail lub hasło');
    }
    const passwordMatches = await argon2.verify(user.passwordHash, password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Nieprawidłowy e-mail lub hasło');
    }
    return user;
  }

  async login(user: UserDocument): Promise<AuthTokens> {
    const tokens = await this.issueTokens(user);
    await this.usersService.updateLastLoginAt(user._id.toString());
    return tokens;
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<AuthTokens> {
    const user = await this.usersService.findById(userId);
    if (!user?.hashedRefreshToken) {
      throw new UnauthorizedException('Sesja wygasła, zaloguj się ponownie');
    }
    const matches = await argon2.verify(user.hashedRefreshToken, refreshToken);
    if (!matches) {
      throw new UnauthorizedException('Sesja wygasła, zaloguj się ponownie');
    }
    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.setHashedRefreshToken(userId, null);
  }

  private async issueTokens(user: UserDocument): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN'),
      } as JwtSignOptions),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      } as JwtSignOptions),
    ]);

    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.usersService.setHashedRefreshToken(
      user._id.toString(),
      hashedRefreshToken,
    );

    return { accessToken, refreshToken };
  }
}
