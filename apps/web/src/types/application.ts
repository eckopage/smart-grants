import type { Grant } from './grant';

export type ApplicationStatus =
  | 'intent'
  | 'matched'
  | 'in_progress'
  | 'submitted'
  | 'completed'
  | 'rejected'
  | 'withdrawn';

export interface Application {
  _id: string;
  grantId: Grant | string;
  userId: string;
  companyId: string | null;
  status: ApplicationStatus;
  createdAt: string;
}

export interface RecommendedCompany {
  _id: string;
  name: string;
  description?: string;
  servicesOffered: string[];
  contactEmail: string;
  isVerified: boolean;
}
