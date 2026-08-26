import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
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
});
