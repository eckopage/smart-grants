import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../users/schemas/user.schema';
import { SubscriptionsService } from '../subscriptions.service';
import { ActiveSubscriptionGuard } from './active-subscription.guard';

function buildContext(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('ActiveSubscriptionGuard', () => {
  let guard: ActiveSubscriptionGuard;
  let subscriptionsService: { findActiveForUser: jest.Mock };

  beforeEach(() => {
    subscriptionsService = { findActiveForUser: jest.fn() };
    guard = new ActiveSubscriptionGuard(
      subscriptionsService as unknown as SubscriptionsService,
    );
  });

  it('denies access when there is no authenticated user', async () => {
    await expect(guard.canActivate(buildContext(undefined))).resolves.toBe(
      false,
    );
  });

  it('allows admins without checking a subscription', async () => {
    const context = buildContext({ userId: '1', role: UserRole.ADMIN });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(subscriptionsService.findActiveForUser).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException when the user has no active subscription', async () => {
    subscriptionsService.findActiveForUser.mockResolvedValue(null);
    const context = buildContext({ userId: '1', role: UserRole.ENTREPRENEUR });
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows access when the user has an active subscription', async () => {
    subscriptionsService.findActiveForUser.mockResolvedValue({
      status: 'active',
    });
    const context = buildContext({ userId: '1', role: UserRole.ENTREPRENEUR });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
