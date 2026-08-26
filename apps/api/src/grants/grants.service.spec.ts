import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { GrantSource, GrantType } from './constants';
import { Grant } from './schemas/grant.schema';
import { GrantsService } from './grants.service';

describe('GrantsService', () => {
  let service: GrantsService;
  let saveMock: jest.Mock;
  let modelConstructor: jest.Mock;
  let queryChain: {
    sort: jest.Mock;
    skip: jest.Mock;
    limit: jest.Mock;
    exec: jest.Mock;
  };
  let model: {
    findOne: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
    find: jest.Mock;
    countDocuments: jest.Mock;
    exists: jest.Mock;
  };

  beforeEach(async () => {
    saveMock = jest.fn().mockResolvedValue({ title: 'Grant', slug: 'grant' });
    modelConstructor = jest.fn().mockImplementation((dto: unknown) => ({
      ...(dto as Record<string, unknown>),
      save: saveMock,
    }));

    queryChain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };

    model = {
      findOne: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      findById: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      findByIdAndUpdate: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      findByIdAndDelete: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      find: jest.fn().mockReturnValue(queryChain),
      countDocuments: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
      exists: jest.fn().mockResolvedValue(null),
    };
    Object.assign(modelConstructor, model);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GrantsService,
        { provide: getModelToken(Grant.name), useValue: modelConstructor },
      ],
    }).compile();

    service = module.get<GrantsService>(GrantsService);
  });

  describe('create', () => {
    it('generates a slug from the title and saves the grant', async () => {
      await service.create({
        title: 'Dotacja na cyfryzację',
        description: 'opis',
        type: GrantType.GRANT,
        source: GrantSource.NATIONAL,
        programme: 'FENG',
        institution: 'PARP',
      });

      expect(modelConstructor).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'dotacja-na-cyfryzacje' }),
      );
      expect(saveMock).toHaveBeenCalled();
    });

    it('appends a numeric suffix when the slug already exists', async () => {
      model.exists
        .mockResolvedValueOnce({ _id: 'existing' })
        .mockResolvedValueOnce(null);

      await service.create({
        title: 'Dotacja',
        description: 'opis',
        type: GrantType.GRANT,
        source: GrantSource.NATIONAL,
        programme: 'FENG',
        institution: 'PARP',
      });

      expect(modelConstructor).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'dotacja-2' }),
      );
    });
  });

  describe('findBySlug', () => {
    it('throws NotFoundException when missing', async () => {
      await expect(service.findBySlug('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('applies pagination defaults and returns a paginated result', async () => {
      const result = await service.findAll({ page: 2, limit: 10 });
      expect(model.find).toHaveBeenCalled();
      expect(queryChain.skip).toHaveBeenCalledWith(10);
      expect(queryChain.limit).toHaveBeenCalledWith(10);
      expect(result).toEqual({ items: [], total: 0, page: 2, limit: 10 });
    });

    it('builds a filter from voivodeships and category', async () => {
      await service.findAll({
        voivodeships: ['mazowieckie'],
        category: ['cyfryzacja'],
        page: 1,
        limit: 20,
      });
      expect(model.find).toHaveBeenCalledWith(
        expect.objectContaining({
          voivodeships: { $in: ['mazowieckie'] },
          category: { $in: ['cyfryzacja'] },
        }),
      );
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when the grant does not exist', async () => {
      await expect(service.remove('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
