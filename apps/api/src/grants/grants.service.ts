import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter } from 'mongoose';
import { GrantSource, GrantType } from './constants';
import { CreateGrantDto } from './dto/create-grant.dto';
import { QueryGrantsDto } from './dto/query-grants.dto';
import { UpdateGrantDto } from './dto/update-grant.dto';
import { Grant, GrantDocument } from './schemas/grant.schema';
import { slugifyTitle } from './slug.util';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/** Normalized shape produced by ingestion adapters, keyed by (sourceSystem, externalId). */
export interface UpsertExternalGrantInput {
  sourceSystem: string;
  externalId: string;
  title: string;
  description: string;
  shortSummary?: string;
  type: GrantType;
  source: GrantSource;
  programme: string;
  institution: string;
  voivodeships?: string[];
  category?: string[];
  tags?: string[];
  fundingRange?: { min: number; max: number };
  eligibleCosts?: string[];
  sourceUrl?: string;
  timeline?: {
    announcedAt?: Date;
    submissionOpensAt?: Date;
    submissionClosesAt?: Date;
    resultsAt?: Date;
  };
}

export interface UpsertResult {
  grant: GrantDocument;
  wasCreated: boolean;
  wasUpdated: boolean;
}

@Injectable()
export class GrantsService {
  constructor(
    @InjectModel(Grant.name) private grantModel: Model<GrantDocument>,
  ) {}

  async create(dto: CreateGrantDto): Promise<GrantDocument> {
    const slug = await this.generateUniqueSlug(dto.title);
    const grant = new this.grantModel({ ...dto, slug });
    return grant.save();
  }

  async findAll(
    query: QueryGrantsDto,
  ): Promise<PaginatedResult<GrantDocument>> {
    const filter: QueryFilter<GrantDocument> = {};

    if (query.search) {
      filter.$text = { $search: query.search };
    }
    if (query.voivodeships?.length) {
      filter.voivodeships = { $in: query.voivodeships };
    }
    if (query.category?.length) {
      filter.category = { $in: query.category };
    }
    if (query.tags?.length) {
      filter.tags = { $in: query.tags };
    }
    if (query.type) {
      filter.type = query.type;
    }
    if (query.source) {
      filter.source = query.source;
    }
    if (query.status) {
      filter['timeline.status'] = query.status;
    }
    if (query.minFunding !== undefined) {
      filter['fundingRange.max'] = { $gte: query.minFunding };
    }
    if (query.maxFunding !== undefined) {
      filter['fundingRange.min'] = {
        ...(filter['fundingRange.min'] as object),
        $lte: query.maxFunding,
      };
    }
    if (query.submissionClosesBefore || query.submissionClosesAfter) {
      filter['timeline.submissionClosesAt'] = {
        ...(query.submissionClosesBefore
          ? { $lte: new Date(query.submissionClosesBefore) }
          : {}),
        ...(query.submissionClosesAfter
          ? { $gte: new Date(query.submissionClosesAfter) }
          : {}),
      };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await Promise.all([
      this.grantModel
        .find(filter)
        .sort({ 'timeline.submissionClosesAt': 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.grantModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async findBySlug(slug: string): Promise<GrantDocument> {
    const grant = await this.grantModel.findOne({ slug }).exec();
    if (!grant) {
      throw new NotFoundException('Nie znaleziono dotacji');
    }
    return grant;
  }

  async findById(id: string): Promise<GrantDocument> {
    const grant = await this.grantModel.findById(id).exec();
    if (!grant) {
      throw new NotFoundException('Nie znaleziono dotacji');
    }
    return grant;
  }

  async update(id: string, dto: UpdateGrantDto): Promise<GrantDocument> {
    const { timelineStatus, ...rest } = dto;
    const update: Record<string, unknown> = { ...rest };
    if (timelineStatus) {
      update['timeline.status'] = timelineStatus;
    }
    const grant = await this.grantModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
    if (!grant) {
      throw new NotFoundException('Nie znaleziono dotacji');
    }
    return grant;
  }

  async remove(id: string): Promise<void> {
    const result = await this.grantModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Nie znaleziono dotacji');
    }
  }

  async upsertFromExternalSource(
    input: UpsertExternalGrantInput,
  ): Promise<UpsertResult> {
    const existing = await this.grantModel
      .findOne({
        sourceSystem: input.sourceSystem,
        externalId: input.externalId,
      })
      .exec();

    if (!existing) {
      const slug = await this.generateUniqueSlug(input.title);
      const grant = await new this.grantModel({
        ...input,
        slug,
        lastScrapedAt: new Date(),
      }).save();
      return { grant, wasCreated: true, wasUpdated: false };
    }

    const changed =
      existing.title !== input.title ||
      existing.description !== input.description ||
      existing.timeline?.submissionClosesAt?.toISOString() !==
        input.timeline?.submissionClosesAt?.toISOString();

    if (changed) {
      existing.title = input.title;
      existing.description = input.description;
      existing.shortSummary = input.shortSummary;
      existing.fundingRange = input.fundingRange;
      existing.sourceUrl = input.sourceUrl;
      if (input.timeline) {
        Object.assign(existing.timeline, input.timeline);
      }
    }
    existing.lastScrapedAt = new Date();
    await existing.save();
    return { grant: existing, wasCreated: false, wasUpdated: changed };
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const base = slugifyTitle(title);
    let candidate = base;
    let suffix = 1;
    while (await this.grantModel.exists({ slug: candidate })) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
    return candidate;
  }
}
