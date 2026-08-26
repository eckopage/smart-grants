import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { QueryGrantsDto } from './dto/query-grants.dto';
import { GrantsService } from './grants.service';

@ApiTags('grants')
@Controller('grants')
export class GrantsController {
  constructor(private readonly grantsService: GrantsService) {}

  @Get()
  findAll(@Query() query: QueryGrantsDto) {
    return this.grantsService.findAll(query);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.grantsService.findBySlug(slug);
  }
}
