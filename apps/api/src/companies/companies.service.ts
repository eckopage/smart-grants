import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { CreateCompanyDto } from './dto/create-company.dto';
import { QueryCompaniesDto } from './dto/query-companies.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import {
  COMPANY_PLAN_RANK,
  Company,
  CompanyDocument,
} from './schemas/company.schema';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  async create(
    userId: string,
    dto: CreateCompanyDto,
  ): Promise<CompanyDocument> {
    const existing = await this.companyModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (existing) {
      throw new ConflictException('Profil firmy dla tego konta już istnieje');
    }
    return new this.companyModel({
      ...dto,
      userId: new Types.ObjectId(userId),
    }).save();
  }

  async findAll(query: QueryCompaniesDto): Promise<CompanyDocument[]> {
    const filter: QueryFilter<CompanyDocument> = {};
    if (query.voivodeship?.length) {
      filter.voivodeshipsServed = { $in: query.voivodeship };
    }
    if (query.specialization?.length) {
      filter.specializations = { $in: query.specialization };
    }
    if (query.search) {
      filter.name = { $regex: query.search, $options: 'i' };
    }

    const companies = await this.companyModel.find(filter).exec();
    return companies.sort(
      (a, b) =>
        COMPANY_PLAN_RANK[b.subscriptionPlan] -
        COMPANY_PLAN_RANK[a.subscriptionPlan],
    );
  }

  async findById(id: string): Promise<CompanyDocument> {
    const company = await this.companyModel.findById(id).exec();
    if (!company) {
      throw new NotFoundException('Nie znaleziono firmy');
    }
    return company;
  }

  async findByUserId(userId: string): Promise<CompanyDocument> {
    const company = await this.companyModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!company) {
      throw new NotFoundException(
        'Nie znaleziono profilu firmy dla tego konta',
      );
    }
    return company;
  }

  async updateOwn(
    userId: string,
    dto: UpdateCompanyDto,
  ): Promise<CompanyDocument> {
    const company = await this.companyModel
      .findOneAndUpdate({ userId: new Types.ObjectId(userId) }, dto, {
        new: true,
      })
      .exec();
    if (!company) {
      throw new NotFoundException(
        'Nie znaleziono profilu firmy dla tego konta',
      );
    }
    return company;
  }

  async setVerified(id: string, isVerified: boolean): Promise<CompanyDocument> {
    const company = await this.companyModel
      .findByIdAndUpdate(id, { isVerified }, { new: true })
      .exec();
    if (!company) {
      throw new NotFoundException('Nie znaleziono firmy');
    }
    return company;
  }

  /** Companies recommended for a grant, based on category/voivodeship overlap. */
  async findRecommendedForGrant(
    category: string[],
    voivodeships: string[],
  ): Promise<CompanyDocument[]> {
    const filter: QueryFilter<CompanyDocument> = {
      isVerified: true,
      ...(category.length ? { specializations: { $in: category } } : {}),
    };
    const candidates = await this.companyModel.find(filter).exec();

    const matches = candidates.filter((company) => {
      if (voivodeships.length === 0) return true;
      if (company.voivodeshipsServed.length === 0) return true;
      return company.voivodeshipsServed.some((v) => voivodeships.includes(v));
    });

    return matches
      .sort(
        (a, b) =>
          COMPANY_PLAN_RANK[b.subscriptionPlan] -
          COMPANY_PLAN_RANK[a.subscriptionPlan],
      )
      .slice(0, 10);
  }
}
