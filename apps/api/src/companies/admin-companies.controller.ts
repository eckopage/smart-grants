import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import { CompaniesService } from './companies.service';
import { QueryCompaniesDto } from './dto/query-companies.dto';

class SetVerifiedDto {
  @IsBoolean()
  isVerified: boolean;
}

@ApiTags('admin/companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/companies')
export class AdminCompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  findAll(@Query() query: QueryCompaniesDto) {
    return this.companiesService.findAll(query);
  }

  @Patch(':id/verify')
  setVerified(@Param('id') id: string, @Body() dto: SetVerifiedDto) {
    return this.companiesService.setVerified(id, dto.isVerified);
  }
}
