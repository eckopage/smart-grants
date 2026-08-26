import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../../auth/types/jwt-payload.interface';
import { UserRole } from '../../users/schemas/user.schema';
import { SubscriptionsService } from '../subscriptions.service';

/**
 * Guards routes that require an active, paid subscription — the paywall
 * described in the business spec ("dostęp dla przedsiębiorców jest
 * płatny"). Admins bypass the check.
 */
@Injectable()
export class ActiveSubscriptionGuard implements CanActivate {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;
    if (!user) {
      return false;
    }
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const subscription = await this.subscriptionsService.findActiveForUser(
      user.userId,
    );
    if (!subscription) {
      throw new ForbiddenException('Ta funkcja wymaga aktywnej subskrypcji');
    }
    return true;
  }
}
