import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { CompaniesService } from '../companies/companies.service';
import { GrantsService } from '../grants/grants.service';
import { MAIL_PROVIDER } from '../mail/mail-provider.interface';
import { ApplicationsService } from './applications.service';
import { Application, ApplicationStatus } from './schemas/application.schema';

const USER_ID = new Types.ObjectId().toString();
const GRANT_ID = new Types.ObjectId().toString();

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let saveMock: jest.Mock;
  let modelConstructor: jest.Mock;
  let model: { findOne: jest.Mock; findById: jest.Mock; find: jest.Mock };
  let grantsService: { findById: jest.Mock };
  let companiesService: {
    findRecommendedForGrant: jest.Mock;
    findByUserId: jest.Mock;
  };
  let mailProvider: { send: jest.Mock };

  const grant = {
    _id: GRANT_ID,
    title: 'Dotacja X',
    category: ['cyfryzacja'],
    voivodeships: [],
  };

  beforeEach(async () => {
    saveMock = jest.fn().mockImplementation(function (this: unknown) {
      return Promise.resolve(this);
    });
    modelConstructor = jest.fn().mockImplementation((dto: unknown) => ({
      ...(dto as Record<string, unknown>),
      save: saveMock,
    }));

    model = {
      findOne: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
        populate: jest.fn().mockReturnThis(),
      }),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }),
    };
    Object.assign(modelConstructor, model);

    grantsService = { findById: jest.fn().mockResolvedValue(grant) };
    companiesService = {
      findRecommendedForGrant: jest.fn().mockResolvedValue([]),
      findByUserId: jest.fn(),
    };
    mailProvider = { send: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        {
          provide: getModelToken(Application.name),
          useValue: modelConstructor,
        },
        { provide: GrantsService, useValue: grantsService },
        { provide: CompaniesService, useValue: companiesService },
        { provide: MAIL_PROVIDER, useValue: mailProvider },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  describe('createIntent', () => {
    it('creates an application and notifies the user and matched companies', async () => {
      companiesService.findRecommendedForGrant.mockResolvedValue([
        { contactEmail: 'company1@example.com' },
        { contactEmail: 'company2@example.com' },
      ]);

      await service.createIntent(USER_ID, 'user@example.com', GRANT_ID);

      expect(saveMock).toHaveBeenCalled();
      expect(mailProvider.send).toHaveBeenCalledTimes(3);
      expect(mailProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'user@example.com' }),
      );
      expect(mailProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'company1@example.com' }),
      );
    });

    it('throws ConflictException when a non-withdrawn application already exists', async () => {
      model.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ status: ApplicationStatus.INTENT }),
      });
      await expect(
        service.createIntent(USER_ID, 'user@example.com', GRANT_ID),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('take', () => {
    it('throws ConflictException when the application is no longer in intent status', async () => {
      companiesService.findByUserId.mockResolvedValue({
        _id: new Types.ObjectId(),
      });
      model.findById.mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ status: ApplicationStatus.MATCHED }),
      });
      await expect(service.take('app-id', 'company-user-id')).rejects.toThrow(
        ConflictException,
      );
    });

    it('matches the application to the company', async () => {
      const companyId = new Types.ObjectId();
      companiesService.findByUserId.mockResolvedValue({ _id: companyId });
      const application = {
        status: ApplicationStatus.INTENT,
        companyId: null,
        save: jest.fn().mockImplementation(function (this: unknown) {
          return Promise.resolve(this);
        }),
      };
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(application),
      });

      const result = await service.take('app-id', 'company-user-id');
      expect(result.status).toBe(ApplicationStatus.MATCHED);
      expect(result.companyId).toBe(companyId);
    });
  });

  describe('withdraw', () => {
    it('throws ForbiddenException when the user does not own the application', async () => {
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ userId: new Types.ObjectId() }),
      });
      await expect(service.withdraw('app-id', USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when missing', async () => {
      model.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.findById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('assertCanAccess', () => {
    it('allows the owner', async () => {
      const application = { userId: { toString: () => USER_ID } };
      await expect(
        service.assertCanAccess(application as any, USER_ID),
      ).resolves.toBeUndefined();
    });

    it('denies a user who is neither owner nor assigned company', async () => {
      companiesService.findByUserId.mockRejectedValue(new NotFoundException());
      const application = {
        userId: { toString: () => 'someone-else' },
        companyId: null,
      };
      await expect(
        service.assertCanAccess(application as any, USER_ID),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
