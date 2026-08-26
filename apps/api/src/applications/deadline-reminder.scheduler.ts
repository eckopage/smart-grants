import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CompaniesService } from '../companies/companies.service';
import { MAIL_PROVIDER } from '../mail/mail-provider.interface';
import type { MailProvider } from '../mail/mail-provider.interface';
import { UsersService } from '../users/users.service';
import { ApplicationsService } from './applications.service';
import { TimelineItemAssignee } from './schemas/application.schema';

const REMINDER_WINDOW_DAYS = 2;

@Injectable()
export class DeadlineReminderScheduler {
  private readonly logger = new Logger(DeadlineReminderScheduler.name);

  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly companiesService: CompaniesService,
    private readonly usersService: UsersService,
    @Inject(MAIL_PROVIDER) private readonly mailProvider: MailProvider,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendUpcomingDeadlineReminders(): Promise<void> {
    const upcoming =
      await this.applicationsService.findUpcomingDeadlineItems(
        REMINDER_WINDOW_DAYS,
      );

    for (const { application, itemTitle, dueDate } of upcoming) {
      const item = application.timeline.find((i) => i.title === itemTitle);
      const assignee = item?.assignedTo;

      try {
        const recipientEmail = await this.resolveRecipientEmail(
          assignee,
          application.userId.toString(),
          application.companyId?.toString(),
        );
        if (!recipientEmail) continue;

        await this.mailProvider.send({
          to: recipientEmail,
          subject: `Zbliżający się termin: „${itemTitle}”`,
          text: `Termin „${itemTitle}” upływa ${dueDate.toLocaleDateString('pl-PL')}. Sprawdź panel zgłoszeń.`,
        });
      } catch (err) {
        this.logger.warn(`Failed to send deadline reminder: ${String(err)}`);
      }
    }
  }

  private async resolveRecipientEmail(
    assignee: TimelineItemAssignee | undefined,
    userId: string,
    companyId: string | undefined,
  ): Promise<string | null> {
    if (assignee === TimelineItemAssignee.COMPANY && companyId) {
      const company = await this.companiesService.findById(companyId);
      return company.contactEmail;
    }
    const user = await this.usersService.findById(userId);
    return user?.email ?? null;
  }
}
