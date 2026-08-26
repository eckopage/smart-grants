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
import {
  Application,
  ApplicationDocument,
  ApplicationStatus,
} from './schemas/application.schema';

const MAX_NOTIFIED_COMPANIES = 5;

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectModel(Application.name)
    private applicationModel: Model<ApplicationDocument>,
    private readonly grantsService: GrantsService,
    private readonly companiesService: CompaniesService,
    @Inject(MAIL_PROVIDER) private readonly mailProvider: MailProvider,
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

  async assertCanAccess(
    application: ApplicationDocument,
    userId: string,
  ): Promise<void> {
    const isOwner = application.userId.toString() === userId;
    if (isOwner) return;

    if (application.companyId) {
      const company = await this.companiesService
        .findByUserId(userId)
        .catch(() => null);
      if (
        company &&
        company._id.toString() === application.companyId.toString()
      ) {
        return;
      }
    }
    throw new ForbiddenException('Brak dostępu do tego zgłoszenia');
  }

  async take(
    applicationId: string,
    companyUserId: string,
  ): Promise<ApplicationDocument> {
    const company = await this.companiesService.findByUserId(companyUserId);
    const application = await this.applicationModel
      .findById(applicationId)
      .exec();
    if (!application) {
      throw new NotFoundException('Nie znaleziono zgłoszenia');
    }
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
    const application = await this.applicationModel
      .findById(applicationId)
      .exec();
    if (!application) {
      throw new NotFoundException('Nie znaleziono zgłoszenia');
    }
    if (application.userId.toString() !== userId) {
      throw new ForbiddenException('Brak dostępu do tego zgłoszenia');
    }
    application.status = ApplicationStatus.WITHDRAWN;
    return application.save();
  }
}
