import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from '../companies/companies.service';
import { MAIL_PROVIDER } from '../mail/mail-provider.interface';
import { UsersService } from '../users/users.service';
import { ApplicationsService } from './applications.service';
import { DeadlineReminderScheduler } from './deadline-reminder.scheduler';
import { TimelineItemAssignee } from './schemas/application.schema';

describe('DeadlineReminderScheduler', () => {
  let scheduler: DeadlineReminderScheduler;
  let applicationsService: { findUpcomingDeadlineItems: jest.Mock };
  let companiesService: { findById: jest.Mock };
  let usersService: { findById: jest.Mock };
  let mailProvider: { send: jest.Mock };

  beforeEach(async () => {
    applicationsService = {
      findUpcomingDeadlineItems: jest.fn().mockResolvedValue([]),
    };
    companiesService = { findById: jest.fn() };
    usersService = { findById: jest.fn() };
    mailProvider = { send: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeadlineReminderScheduler,
        { provide: ApplicationsService, useValue: applicationsService },
        { provide: CompaniesService, useValue: companiesService },
        { provide: UsersService, useValue: usersService },
        { provide: MAIL_PROVIDER, useValue: mailProvider },
      ],
    }).compile();

    scheduler = module.get<DeadlineReminderScheduler>(
      DeadlineReminderScheduler,
    );
  });

  it('does nothing when there are no upcoming deadlines', async () => {
    await scheduler.sendUpcomingDeadlineReminders();
    expect(mailProvider.send).not.toHaveBeenCalled();
  });

  it('notifies the user when the timeline item is assigned to them', async () => {
    const dueDate = new Date();
    applicationsService.findUpcomingDeadlineItems.mockResolvedValue([
      {
        application: {
          userId: { toString: () => 'user-1' },
          companyId: null,
          timeline: [
            {
              title: 'Dostarczyć zaświadczenie',
              assignedTo: TimelineItemAssignee.USER,
            },
          ],
        },
        itemTitle: 'Dostarczyć zaświadczenie',
        dueDate,
      },
    ]);
    usersService.findById.mockResolvedValue({ email: 'user@example.com' });

    await scheduler.sendUpcomingDeadlineReminders();

    expect(mailProvider.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@example.com' }),
    );
  });

  it('notifies the company when the timeline item is assigned to them', async () => {
    const dueDate = new Date();
    applicationsService.findUpcomingDeadlineItems.mockResolvedValue([
      {
        application: {
          userId: { toString: () => 'user-1' },
          companyId: { toString: () => 'company-1' },
          timeline: [
            {
              title: 'Złożyć wniosek',
              assignedTo: TimelineItemAssignee.COMPANY,
            },
          ],
        },
        itemTitle: 'Złożyć wniosek',
        dueDate,
      },
    ]);
    companiesService.findById.mockResolvedValue({
      contactEmail: 'company@example.com',
    });

    await scheduler.sendUpcomingDeadlineReminders();

    expect(mailProvider.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'company@example.com' }),
    );
  });
});
