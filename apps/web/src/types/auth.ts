export type UserRole = 'entrepreneur' | 'company' | 'admin';

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
  companyName?: string;
  nip?: string;
  phone?: string;
}

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
}
