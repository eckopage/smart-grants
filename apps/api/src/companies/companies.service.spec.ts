import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { CompaniesService } from './companies.service';
import { Company, CompanyPlanKey } from './schemas/company.schema';

const USER_ID = new Types.ObjectId().toString();

describe('CompaniesService', () => {
  let service: CompaniesService;
  let saveMock: jest.Mock;
  let modelConstructor: jest.Mock;
  let model: {
    findOne: jest.Mock;
    findById: jest.Mock;
    findOneAndUpdate: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    find: jest.Mock;
  };

  beforeEach(async () => {
    saveMock = jest.fn().mockResolvedValue({ name: 'ACME Doradztwo' });
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
      findOneAndUpdate: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      findByIdAndUpdate: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      find: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
    };
    Object.assign(modelConstructor, model);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: getModelToken(Company.name), useValue: modelConstructor },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
  });

  describe('create', () => {
    it('throws ConflictException when a profile already exists for the user', async () => {
      model.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ name: 'Existing' }),
      });
      await expect(
        service.create(USER_ID, {
          name: 'ACME',
          contactEmail: 'a@acme.pl',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates a company profile linked to the user', async () => {
      await service.create(USER_ID, {
        name: 'ACME Doradztwo',
        contactEmail: 'a@acme.pl',
      });
      expect(modelConstructor).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'ACME Doradztwo' }),
      );
      expect(saveMock).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when missing', async () => {
      await expect(service.findById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('sorts companies by plan rank, highest first', async () => {
      model.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          { name: 'Basic Co', subscriptionPlan: CompanyPlanKey.BASIC_LISTING },
          {
            name: 'Premium Co',
            subscriptionPlan: CompanyPlanKey.PREMIUM_LEADS,
          },
          { name: 'Featured Co', subscriptionPlan: CompanyPlanKey.FEATURED },
        ]),
      });

      const result = await service.findAll({});
      expect(result.map((c) => c.name)).toEqual([
        'Premium Co',
        'Featured Co',
        'Basic Co',
      ]);
    });
  });

  describe('findRecommendedForGrant', () => {
    it('filters by verified status and voivodeship overlap', async () => {
      model.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          {
            name: 'Nationwide Co',
            voivodeshipsServed: [],
            subscriptionPlan: CompanyPlanKey.BASIC_LISTING,
          },
          {
            name: 'Mazowieckie Co',
            voivodeshipsServed: ['mazowieckie'],
            subscriptionPlan: CompanyPlanKey.PREMIUM_LEADS,
          },
          {
            name: 'Slaskie Co',
            voivodeshipsServed: ['slaskie'],
            subscriptionPlan: CompanyPlanKey.FEATURED,
          },
        ]),
      });

      const result = await service.findRecommendedForGrant(
        ['cyfryzacja'],
        ['mazowieckie'],
      );

      expect(result.map((c) => c.name)).toEqual([
        'Mazowieckie Co',
        'Nationwide Co',
      ]);
    });
  });
});
