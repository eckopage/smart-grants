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
import { CreateMessageDto } from './dto/create-message.dto';
import { RegisterDocumentDto } from './dto/register-document.dto';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';
import {
  CreateTimelineItemDto,
  UpdateTimelineItemDto,
} from './dto/timeline-item.dto';

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

  @Post(':id/documents/upload-url')
  requestUploadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RequestUploadUrlDto,
  ) {
    return this.applicationsService.requestDocumentUploadUrl(
      id,
      user.userId,
      dto,
    );
  }

  @Post(':id/documents')
  registerDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RegisterDocumentDto,
  ) {
    return this.applicationsService.registerDocument(id, user.userId, dto);
  }

  @Get(':id/documents/:documentId/download-url')
  getDocumentDownloadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('documentId') documentId: string,
  ) {
    return this.applicationsService
      .getDocumentDownloadUrl(id, user.userId, documentId)
      .then((url) => ({ url }));
  }

  @Post(':id/messages')
  addMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.applicationsService.addMessage(id, user.userId, dto);
  }

  @Patch(':id/messages/read')
  markMessagesRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.applicationsService.markMessagesRead(id, user.userId);
  }

  @Post(':id/timeline')
  addTimelineItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateTimelineItemDto,
  ) {
    return this.applicationsService.addTimelineItem(id, user.userId, dto);
  }

  @Patch(':id/timeline/:itemId')
  updateTimelineItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateTimelineItemDto,
  ) {
    return this.applicationsService.updateTimelineItemStatus(
      id,
      user.userId,
      itemId,
      dto.status,
    );
  }
}
