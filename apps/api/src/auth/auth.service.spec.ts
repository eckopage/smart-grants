import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { Types } from 'mongoose';
import { UserRole } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmail: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    setHashedRefreshToken: jest.Mock;
    updateLastLoginAt: jest.Mock;
  };

  const buildUser = async (overrides: Record<string, unknown> = {}) => ({
    _id: new Types.ObjectId(),
    email: 'user@example.com',
    passwordHash: await argon2.hash('correct-password'),
    role: UserRole.ENTREPRENEUR,
    hashedRefreshToken: undefined as string | undefined,
    ...overrides,
  });

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      setHashedRefreshToken: jest.fn(),
      updateLastLoginAt: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        JwtService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              ({
                JWT_ACCESS_SECRET: 'access-secret',
                JWT_ACCESS_EXPIRES_IN: '15m',
                JWT_REFRESH_SECRET: 'refresh-secret',
                JWT_REFRESH_EXPIRES_IN: '7d',
              })[key],
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('throws ConflictException when the email is already taken', async () => {
      usersService.findByEmail.mockResolvedValue(await buildUser());

      await expect(
        service.register({ email: 'user@example.com', password: 'pw' }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates a user and issues tokens', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      const created = await buildUser();
      usersService.create.mockResolvedValue(created);

      const result = await service.register({
        email: 'user@example.com',
        password: 'a-strong-password',
      });

      expect(usersService.create).toHaveBeenCalled();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect(usersService.setHashedRefreshToken).toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('throws UnauthorizedException when user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.validateUser('missing@example.com', 'pw'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException on wrong password', async () => {
      usersService.findByEmail.mockResolvedValue(await buildUser());
      await expect(
        service.validateUser('user@example.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns the user on correct credentials', async () => {
      const user = await buildUser();
      usersService.findByEmail.mockResolvedValue(user);
      const result = await service.validateUser(
        'user@example.com',
        'correct-password',
      );
      expect(result).toBe(user);
    });
  });

  describe('refreshTokens', () => {
    it('throws when the user has no stored refresh token', async () => {
      usersService.findById.mockResolvedValue(await buildUser());
      await expect(
        service.refreshTokens('user-id', 'some-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rotates tokens when the refresh token matches', async () => {
      const hashedRefreshToken = await argon2.hash('valid-refresh-token');
      usersService.findById.mockResolvedValue(
        await buildUser({ hashedRefreshToken }),
      );

      const result = await service.refreshTokens(
        'user-id',
        'valid-refresh-token',
      );
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe('logout', () => {
    it('clears the stored refresh token', async () => {
      await service.logout('user-id');
      expect(usersService.setHashedRefreshToken).toHaveBeenCalledWith(
        'user-id',
        null,
      );
    });
  });
});
