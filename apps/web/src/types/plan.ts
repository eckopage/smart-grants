export interface PlanLimits {
  maxFavorites: number | null;
  leadContactsPerMonth: number | null;
  maxTeamAccounts: number;
  exportData: boolean;
  apiAccess: boolean;
}

export interface Plan {
  _id: string;
  key: string;
  audience: 'entrepreneur' | 'company';
  name: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  limits: PlanLimits;
}
