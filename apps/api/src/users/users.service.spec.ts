import { ConflictException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { User } from './schemas/user.schema';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let model: {
    findOne: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
  };
  let saveMock: jest.Mock;
  let modelConstructor: jest.Mock;

  beforeEach(async () => {
    saveMock = jest.fn().mockResolvedValue({ email: 'a@b.com' });
    modelConstructor = jest.fn().mockImplementation((dto: unknown) => ({
      ...(dto as Record<string, unknown>),
      save: saveMock,
    }));

    model = {
      findOne: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      findById: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      findByIdAndUpdate: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(undefined) }),
    };
    Object.assign(modelConstructor, model);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: modelConstructor,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('findByEmail lowercases the query', async () => {
    await service.findByEmail('Test@Example.com');
    expect(model.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
  });

  it('create saves a new user document', async () => {
    const result = await service.create({
      email: 'a@b.com',
      passwordHash: 'hashed',
    });
    expect(modelConstructor).toHaveBeenCalled();
    expect(saveMock).toHaveBeenCalled();
    expect(result).toEqual({ email: 'a@b.com' });
  });

  it('setHashedRefreshToken updates the user', async () => {
    await service.setHashedRefreshToken('user-id', 'hashed-token');
    expect(model.findByIdAndUpdate).toHaveBeenCalledWith('user-id', {
      hashedRefreshToken: 'hashed-token',
    });
  });

  describe('favorites', () => {
    function mockUserWithFavorites(favoriteGrants: Types.ObjectId[]) {
      const user = {
        favoriteGrants,
        save: jest.fn().mockImplementation(function (this: {
          favoriteGrants: Types.ObjectId[];
        }) {
          return Promise.resolve(this);
        }),
      };
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });
      return user;
    }

    it('adds a grant to favorites when under the limit', async () => {
      const user = mockUserWithFavorites([]);
      const grantId = new Types.ObjectId().toString();

      await service.addFavorite('user-id', grantId, 10);

      expect(user.favoriteGrants).toHaveLength(1);
      expect(user.save).toHaveBeenCalled();
    });

    it('is idempotent when the grant is already saved', async () => {
      const existing = new Types.ObjectId();
      const user = mockUserWithFavorites([existing]);

      await service.addFavorite('user-id', existing.toString(), 10);

      expect(user.favoriteGrants).toHaveLength(1);
      expect(user.save).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the plan limit is reached', async () => {
      const user = mockUserWithFavorites([
        new Types.ObjectId(),
        new Types.ObjectId(),
      ]);
      const grantId = new Types.ObjectId().toString();

      await expect(service.addFavorite('user-id', grantId, 2)).rejects.toThrow(
        ConflictException,
      );
      expect(user.favoriteGrants).toHaveLength(2);
    });

    it('allows unlimited favorites when maxFavorites is null', async () => {
      const user = mockUserWithFavorites([
        new Types.ObjectId(),
        new Types.ObjectId(),
      ]);
      const grantId = new Types.ObjectId().toString();

      await service.addFavorite('user-id', grantId, null);

      expect(user.favoriteGrants).toHaveLength(3);
    });

    it('removes a grant from favorites', async () => {
      const target = new Types.ObjectId();
      const user = mockUserWithFavorites([target, new Types.ObjectId()]);

      await service.removeFavorite('user-id', target.toString());

      expect(user.favoriteGrants).toHaveLength(1);
      expect(user.save).toHaveBeenCalled();
    });
  });
});
