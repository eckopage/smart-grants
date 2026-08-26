import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { ActiveSubscriptionGuard } from '../subscriptions/guards/active-subscription.guard';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users/me')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('favorites')
  getFavorites(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getFavorites(user.userId);
  }

  @UseGuards(JwtAuthGuard, ActiveSubscriptionGuard)
  @Post('favorites/:grantId')
  async addFavorite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('grantId') grantId: string,
  ) {
    const plan = await this.subscriptionsService.getActivePlanForUser(
      user.userId,
    );
    const maxFavorites = plan?.limits.maxFavorites ?? 0;
    return this.usersService.addFavorite(user.userId, grantId, maxFavorites);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('favorites/:grantId')
  removeFavorite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('grantId') grantId: string,
  ) {
    return this.usersService.removeFavorite(user.userId, grantId);
  }
}
