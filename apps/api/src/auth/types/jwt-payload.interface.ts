import { UserRole } from '../../users/schemas/user.schema';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRefreshUser extends AuthenticatedUser {
  refreshToken: string;
}
