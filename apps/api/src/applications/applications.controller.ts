import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { ActiveSubscriptionGuard } from '../subscriptions/guards/active-subscription.guard';
import { UserRole } from '../users/schemas/user.schema';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';

@ApiTags('applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @UseGuards(RolesGuard, ActiveSubscriptionGuard)
  @Roles(UserRole.ENTREPRENEUR)
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationsService.createIntent(
      user.userId,
      user.email,
      dto.grantId,
    );
  }

  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.applicationsService.findMineAsUser(user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY)
  @Get('company/matched')
  findMatchedForCompany(@CurrentUser() user: AuthenticatedUser) {
    return this.applicationsService.findMatchedForCompany(user.userId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const application = await this.applicationsService.findById(id);
    await this.applicationsService.assertCanAccess(application, user.userId);
    return application;
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY)
  @Patch(':id/take')
  take(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.applicationsService.take(id, user.userId);
  }

  @Patch(':id/withdraw')
  withdraw(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.applicationsService.withdraw(id, user.userId);
  }
}
