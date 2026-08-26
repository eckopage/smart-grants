import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CompaniesService } from '../companies/companies.service';
import { GrantsService } from '../grants/grants.service';
import { MAIL_PROVIDER } from '../mail/mail-provider.interface';
import type { MailProvider } from '../mail/mail-provider.interface';
import { STORAGE_PROVIDER } from '../storage/storage-provider.interface';
import type { StorageProvider } from '../storage/storage-provider.interface';
import { UsersService } from '../users/users.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { RegisterDocumentDto } from './dto/register-document.dto';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';
import { CreateTimelineItemDto } from './dto/timeline-item.dto';
import {
  Application,
  ApplicationDocument,
  ApplicationStatus,
  TimelineItemAssignee,
  TimelineItemStatus,
} from './schemas/application.schema';

const MAX_NOTIFIED_COMPANIES = 5;

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectModel(Application.name)
    private applicationModel: Model<ApplicationDocument>,
    private readonly grantsService: GrantsService,
    private readonly companiesService: CompaniesService,
    private readonly usersService: UsersService,
    @Inject(MAIL_PROVIDER) private readonly mailProvider: MailProvider,
    @Inject(STORAGE_PROVIDER) private readonly storageProvider: StorageProvider,
  ) {}

  async createIntent(
    userId: string,
    userEmail: string,
    grantId: string,
  ): Promise<ApplicationDocument> {
    const grant = await this.grantsService.findById(grantId);

    const existing = await this.applicationModel
      .findOne({
        userId: new Types.ObjectId(userId),
        grantId: new Types.ObjectId(grantId),
        status: { $ne: ApplicationStatus.WITHDRAWN },
      })
      .exec();
    if (existing) {
      throw new ConflictException('Zgłoszenie dla tej dotacji już istnieje');
    }

    const application = await new this.applicationModel({
      userId: new Types.ObjectId(userId),
      grantId: new Types.ObjectId(grantId),
    }).save();

    await this.mailProvider.send({
      to: userEmail,
      subject: `Zgłoszenie do „${grant.title}” przyjęte`,
      text:
        `Dziękujemy za zgłoszenie chęci aplikowania o „${grant.title}”. ` +
        'Sprawdź panel "Moje aplikacje", aby śledzić postęp i dokumenty wymagane w kolejnych krokach.',
    });

    const recommendedCompanies =
      await this.companiesService.findRecommendedForGrant(
        grant.category,
        grant.voivodeships,
      );
    for (const company of recommendedCompanies.slice(
      0,
      MAX_NOTIFIED_COMPANIES,
    )) {
      await this.mailProvider.send({
        to: company.contactEmail,
        subject: `Nowe zgłoszenie do podjęcia: „${grant.title}”`,
        text: `Pojawiło się nowe zgłoszenie pasujące do Twojej specjalizacji. Sprawdź panel zgłoszeń, aby je podjąć.`,
      });
    }

    return application;
  }

  findMineAsUser(userId: string): Promise<ApplicationDocument[]> {
    return this.applicationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate('grantId')
      .exec();
  }

  async findMatchedForCompany(
    companyUserId: string,
  ): Promise<ApplicationDocument[]> {
    const company = await this.companiesService.findByUserId(companyUserId);

    const intents = await this.applicationModel
      .find({ status: ApplicationStatus.INTENT })
      .populate('grantId')
      .exec();

    return intents.filter((application) => {
      const grant = application.grantId as unknown as {
        category: string[];
        voivodeships: string[];
      };
      const categoryMatches =
        company.specializations.length === 0 ||
        grant.category.some((c) => company.specializations.includes(c));
      const voivodeshipMatches =
        company.voivodeshipsServed.length === 0 ||
        grant.voivodeships.length === 0 ||
        grant.voivodeships.some((v) => company.voivodeshipsServed.includes(v));
      return categoryMatches && voivodeshipMatches;
    });
  }

  async findById(id: string): Promise<ApplicationDocument> {
    const application = await this.applicationModel
      .findById(id)
      .populate('grantId')
      .exec();
    if (!application) {
      throw new NotFoundException('Nie znaleziono zgłoszenia');
    }
    return application;
  }

  private async getOrThrow(id: string): Promise<ApplicationDocument> {
    const application = await this.applicationModel.findById(id).exec();
    if (!application) {
      throw new NotFoundException('Nie znaleziono zgłoszenia');
    }
    return application;
  }

  /** Returns 'user' if the caller is the application owner, 'company' if the assigned company. */
  private async resolveRole(
    application: ApplicationDocument,
    userId: string,
  ): Promise<TimelineItemAssignee> {
    if (application.userId.toString() === userId) {
      return TimelineItemAssignee.USER;
    }
    if (application.companyId) {
      const company = await this.companiesService
        .findByUserId(userId)
        .catch(() => null);
      if (
        company &&
        company._id.toString() === application.companyId.toString()
      ) {
        return TimelineItemAssignee.COMPANY;
      }
    }
    throw new ForbiddenException('Brak dostępu do tego zgłoszenia');
  }

  async assertCanAccess(
    application: ApplicationDocument,
    userId: string,
  ): Promise<void> {
    await this.resolveRole(application, userId);
  }

  async take(
    applicationId: string,
    companyUserId: string,
  ): Promise<ApplicationDocument> {
    const company = await this.companiesService.findByUserId(companyUserId);
    const application = await this.getOrThrow(applicationId);
    if (application.status !== ApplicationStatus.INTENT) {
      throw new ConflictException(
        'To zgłoszenie zostało już podjęte przez inną firmę',
      );
    }
    application.status = ApplicationStatus.MATCHED;
    application.companyId = company._id;
    return application.save();
  }

  async withdraw(
    applicationId: string,
    userId: string,
  ): Promise<ApplicationDocument> {
    const application = await this.getOrThrow(applicationId);
    if (application.userId.toString() !== userId) {
      throw new ForbiddenException('Brak dostępu do tego zgłoszenia');
    }
    application.status = ApplicationStatus.WITHDRAWN;
    return application.save();
  }

  private buildDocumentKey(
    applicationId: string,
    category: string,
    fileName: string,
  ): string {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `applications/${applicationId}/${category}/${Date.now()}-${safeName}`;
  }

  async requestDocumentUploadUrl(
    applicationId: string,
    userId: string,
    dto: RequestUploadUrlDto,
  ): Promise<{ uploadUrl: string; key: string }> {
    const application = await this.getOrThrow(applicationId);
    await this.resolveRole(application, userId);
    const key = this.buildDocumentKey(
      applicationId,
      dto.category,
      dto.fileName,
    );
    return this.storageProvider.getUploadUrl(key, dto.contentType);
  }

  async registerDocument(
    applicationId: string,
    userId: string,
    dto: RegisterDocumentDto,
  ): Promise<ApplicationDocument> {
    const application = await this.getOrThrow(applicationId);
    await this.resolveRole(application, userId);

    const previousVersions = application.documents.filter(
      (doc) => doc.fileName === dto.fileName && doc.category === dto.category,
    ).length;

    application.documents.push({
      fileName: dto.fileName,
      fileKey: dto.key,
      category: dto.category,
      uploadedBy: new Types.ObjectId(userId),
      uploadedAt: new Date(),
      version: previousVersions + 1,
    });
    return application.save();
  }

  async getDocumentDownloadUrl(
    applicationId: string,
    userId: string,
    documentId: string,
  ): Promise<string> {
    const application = await this.getOrThrow(applicationId);
    await this.resolveRole(application, userId);
    const document = application.documents.find(
      (doc) => doc._id?.toString() === documentId,
    );
    if (!document) {
      throw new NotFoundException('Nie znaleziono dokumentu');
    }
    return this.storageProvider.getDownloadUrl(document.fileKey);
  }

  async addMessage(
    applicationId: string,
    userId: string,
    dto: CreateMessageDto,
  ): Promise<ApplicationDocument> {
    const application = await this.getOrThrow(applicationId);
    const role = await this.resolveRole(application, userId);

    application.messages.push({
      senderId: new Types.ObjectId(userId),
      senderRole: role,
      content: dto.content,
      attachmentUrl: dto.attachmentUrl,
      createdAt: new Date(),
      readAt: null,
    });
    const saved = await application.save();

    await this.notifyOtherParty(application, role);
    return saved;
  }

  private async notifyOtherParty(
    application: ApplicationDocument,
    senderRole: TimelineItemAssignee,
  ): Promise<void> {
    try {
      if (senderRole === TimelineItemAssignee.USER && application.companyId) {
        const company = await this.companiesService.findById(
          application.companyId.toString(),
        );
        await this.mailProvider.send({
          to: company.contactEmail,
          subject: 'Nowa wiadomość w zgłoszeniu',
          text: 'Otrzymałeś nową wiadomość od klienta. Sprawdź panel zgłoszeń.',
        });
      } else if (senderRole === TimelineItemAssignee.COMPANY) {
        const user = await this.usersService.findById(
          application.userId.toString(),
        );
        if (user) {
          await this.mailProvider.send({
            to: user.email,
            subject: 'Nowa wiadomość od doradcy',
            text: 'Otrzymałeś nową wiadomość od firmy doradczej. Sprawdź panel „Moje aplikacje”.',
          });
        }
      }
    } catch {
      // Best-effort notification — a failed lookup must not fail the message send.
    }
  }

  async markMessagesRead(
    applicationId: string,
    userId: string,
  ): Promise<ApplicationDocument> {
    const application = await this.getOrThrow(applicationId);
    const role = await this.resolveRole(application, userId);

    for (const message of application.messages) {
      if (message.senderRole !== role && !message.readAt) {
        message.readAt = new Date();
      }
    }
    return application.save();
  }

  async addTimelineItem(
    applicationId: string,
    userId: string,
    dto: CreateTimelineItemDto,
  ): Promise<ApplicationDocument> {
    const application = await this.getOrThrow(applicationId);
    await this.resolveRole(application, userId);

    application.timeline.push({
      title: dto.title,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      assignedTo: dto.assignedTo,
      status: TimelineItemStatus.PENDING,
      description: dto.description,
      createdBy: new Types.ObjectId(userId),
    });
    return application.save();
  }

  async updateTimelineItemStatus(
    applicationId: string,
    userId: string,
    itemId: string,
    status: TimelineItemStatus,
  ): Promise<ApplicationDocument> {
    const application = await this.getOrThrow(applicationId);
    await this.resolveRole(application, userId);

    const item = application.timeline.find((i) => i._id?.toString() === itemId);
    if (!item) {
      throw new NotFoundException('Nie znaleziono pozycji osi czasu');
    }
    item.status = status;
    return application.save();
  }

  /** Timeline items due within the given window that are still pending — used for deadline reminders. */
  async findUpcomingDeadlineItems(
    withinDays: number,
  ): Promise<
    { application: ApplicationDocument; itemTitle: string; dueDate: Date }[]
  > {
    const now = new Date();
    const cutoff = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

    const applications = await this.applicationModel
      .find({
        'timeline.status': TimelineItemStatus.PENDING,
        'timeline.dueDate': { $gte: now, $lte: cutoff },
      })
      .exec();

    const results: {
      application: ApplicationDocument;
      itemTitle: string;
      dueDate: Date;
    }[] = [];
    for (const application of applications) {
      for (const item of application.timeline) {
        if (
          item.status === TimelineItemStatus.PENDING &&
          item.dueDate &&
          item.dueDate >= now &&
          item.dueDate <= cutoff
        ) {
          results.push({
            application,
            itemTitle: item.title,
            dueDate: item.dueDate,
          });
        }
      }
    }
    return results;
  }
}
