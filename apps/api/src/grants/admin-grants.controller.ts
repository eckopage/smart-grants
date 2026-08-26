import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import { CreateGrantDto } from './dto/create-grant.dto';
import { QueryGrantsDto } from './dto/query-grants.dto';
import { UpdateGrantDto } from './dto/update-grant.dto';
import { GrantsService } from './grants.service';

@ApiTags('admin/grants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/grants')
export class AdminGrantsController {
  constructor(private readonly grantsService: GrantsService) {}

  @Get()
  findAll(@Query() query: QueryGrantsDto) {
    return this.grantsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.grantsService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateGrantDto) {
    return this.grantsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGrantDto) {
    return this.grantsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.grantsService.remove(id);
  }
}
