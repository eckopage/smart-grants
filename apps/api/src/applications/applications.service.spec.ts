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
import { STORAGE_PROVIDER } from '../storage/storage-provider.interface';
import { UsersService } from '../users/users.service';
import { ApplicationsService } from './applications.service';
import {
  Application,
  ApplicationStatus,
  TimelineItemAssignee,
  TimelineItemStatus,
} from './schemas/application.schema';

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
  let usersService: { findById: jest.Mock };
  let storageProvider: {
    getUploadUrl: jest.Mock;
    getDownloadUrl: jest.Mock;
    deleteObject: jest.Mock;
  };

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
    usersService = { findById: jest.fn().mockResolvedValue(null) };
    storageProvider = {
      getUploadUrl: jest
        .fn()
        .mockResolvedValue({ uploadUrl: 'https://upload', key: 'key-1' }),
      getDownloadUrl: jest.fn().mockResolvedValue('https://download'),
      deleteObject: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        {
          provide: getModelToken(Application.name),
          useValue: modelConstructor,
        },
        { provide: GrantsService, useValue: grantsService },
        { provide: CompaniesService, useValue: companiesService },
        { provide: UsersService, useValue: usersService },
        { provide: MAIL_PROVIDER, useValue: mailProvider },
        { provide: STORAGE_PROVIDER, useValue: storageProvider },
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

  describe('registerDocument', () => {
    function ownedApplication(documents: unknown[] = []) {
      const application = {
        userId: { toString: () => USER_ID },
        companyId: null,
        documents,
        save: jest.fn().mockImplementation(function (this: unknown) {
          return Promise.resolve(this);
        }),
      };
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(application),
      });
      return application;
    }

    it('registers a document at version 1 when none exists yet', async () => {
      const application = ownedApplication([]);
      await service.registerDocument('app-id', USER_ID, {
        fileName: 'wniosek.pdf',
        key: 'key-1',
        category: 'wniosek',
      });
      expect(application.documents).toHaveLength(1);
      expect(application.documents[0]).toMatchObject({ version: 1 });
    });

    it('increments the version for a repeated fileName/category', async () => {
      const application = ownedApplication([
        { fileName: 'wniosek.pdf', category: 'wniosek', fileKey: 'old' },
      ]);
      await service.registerDocument('app-id', USER_ID, {
        fileName: 'wniosek.pdf',
        key: 'key-2',
        category: 'wniosek',
      });
      expect(application.documents).toHaveLength(2);
      expect(application.documents[1]).toMatchObject({ version: 2 });
    });
  });

  describe('getDocumentDownloadUrl', () => {
    it('throws NotFoundException when the document does not exist', async () => {
      const application = {
        userId: { toString: () => USER_ID },
        companyId: null,
        documents: [],
      };
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(application),
      });
      await expect(
        service.getDocumentDownloadUrl('app-id', USER_ID, 'missing-doc'),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns a presigned URL for an existing document', async () => {
      const application = {
        userId: { toString: () => USER_ID },
        companyId: null,
        documents: [{ _id: { toString: () => 'doc-1' }, fileKey: 'key-1' }],
      };
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(application),
      });

      const url = await service.getDocumentDownloadUrl(
        'app-id',
        USER_ID,
        'doc-1',
      );
      expect(storageProvider.getDownloadUrl).toHaveBeenCalledWith('key-1');
      expect(url).toBe('https://download');
    });
  });

  describe('addMessage', () => {
    it('notifies the company when the owner sends a message', async () => {
      const companyId = new Types.ObjectId();
      const application = {
        userId: { toString: () => USER_ID },
        companyId: { toString: () => companyId.toString() },
        messages: [],
        save: jest.fn().mockImplementation(function (this: unknown) {
          return Promise.resolve(this);
        }),
      };
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(application),
      });
      companiesService.findById = jest
        .fn()
        .mockResolvedValue({ contactEmail: 'company@example.com' });

      await service.addMessage('app-id', USER_ID, { content: 'Cześć' });

      expect(application.messages).toHaveLength(1);
      expect(application.messages[0]).toMatchObject({ senderRole: 'user' });
      expect(mailProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'company@example.com' }),
      );
    });
  });

  describe('addTimelineItem and updateTimelineItemStatus', () => {
    it('adds a timeline item created by the caller', async () => {
      const application = {
        userId: { toString: () => USER_ID },
        companyId: null,
        timeline: [],
        save: jest.fn().mockImplementation(function (this: unknown) {
          return Promise.resolve(this);
        }),
      };
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(application),
      });

      await service.addTimelineItem('app-id', USER_ID, {
        title: 'Dostarczyć zaświadczenie ZUS',
        assignedTo: TimelineItemAssignee.USER,
      });

      expect(application.timeline).toHaveLength(1);
      expect(application.timeline[0]).toMatchObject({ status: 'pending' });
    });

    it('throws NotFoundException when updating a missing timeline item', async () => {
      const application = {
        userId: { toString: () => USER_ID },
        companyId: null,
        timeline: [],
      };
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(application),
      });

      await expect(
        service.updateTimelineItemStatus(
          'app-id',
          USER_ID,
          'missing-item',
          TimelineItemStatus.DONE,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findUpcomingDeadlineItems', () => {
    it('returns only pending items due within the window', async () => {
      const now = Date.now();
      const withinWindow = new Date(now + 24 * 60 * 60 * 1000);
      const application = {
        timeline: [
          { title: 'Due soon', status: 'pending', dueDate: withinWindow },
          { title: 'Already done', status: 'done', dueDate: withinWindow },
        ],
      };
      model.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([application]),
      });

      const results = await service.findUpcomingDeadlineItems(2);
      expect(results).toHaveLength(1);
      expect(results[0].itemTitle).toBe('Due soon');
    });
  });
});
