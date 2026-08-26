export type CompanyPlanKey = 'basic_listing' | 'featured' | 'premium_leads';

export interface Company {
  _id: string;
  userId: string;
  name: string;
  nip?: string;
  logoUrl?: string;
  description?: string;
  servicesOffered: string[];
  voivodeshipsServed: string[];
  specializations: string[];
  subscriptionPlan: CompanyPlanKey;
  contactEmail: string;
  contactPhone?: string;
  isVerified: boolean;
}

export interface CreateCompanyInput {
  name: string;
  nip?: string;
  description?: string;
  servicesOffered?: string[];
  voivodeshipsServed?: string[];
  specializations?: string[];
  contactEmail: string;
  contactPhone?: string;
}
