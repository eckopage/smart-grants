import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CompaniesService } from '../companies/companies.service';
import { QueryGrantsDto } from './dto/query-grants.dto';
import { GrantsService } from './grants.service';

@ApiTags('grants')
@Controller('grants')
export class GrantsController {
  constructor(
    private readonly grantsService: GrantsService,
    private readonly companiesService: CompaniesService,
  ) {}

  @Get()
  findAll(@Query() query: QueryGrantsDto) {
    return this.grantsService.findAll(query);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.grantsService.findBySlug(slug);
  }

  @Get(':slug/recommended-companies')
  async findRecommendedCompanies(@Param('slug') slug: string) {
    const grant = await this.grantsService.findBySlug(slug);
    return this.companiesService.findRecommendedForGrant(
      grant.category,
      grant.voivodeships,
    );
  }
}
