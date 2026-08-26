import { apiFetch } from './api-client';
import type { Application } from '../types/application';
import type { Company, CreateCompanyInput } from '../types/company';

export interface CompanyFilters {
  voivodeship?: string[];
  specialization?: string[];
  search?: string;
}

function toQueryString(filters: CompanyFilters): string {
  const params = new URLSearchParams();
  filters.voivodeship?.forEach((v) => params.append('voivodeship', v));
  filters.specialization?.forEach((v) => params.append('specialization', v));
  if (filters.search) params.set('search', filters.search);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function fetchCompanies(filters: CompanyFilters = {}): Promise<Company[]> {
  return apiFetch<Company[]>(`/companies${toQueryString(filters)}`);
}

export function fetchCompany(id: string): Promise<Company> {
  return apiFetch<Company>(`/companies/${id}`);
}

export function fetchOwnCompanyProfile(accessToken: string): Promise<Company> {
  return apiFetch<Company>('/companies/me/profile', { accessToken });
}

export function createCompanyProfile(
  data: CreateCompanyInput,
  accessToken: string,
): Promise<Company> {
  return apiFetch<Company>('/companies/me', {
    method: 'POST',
    accessToken,
    body: JSON.stringify(data),
  });
}

export function updateOwnCompanyProfile(
  data: Partial<CreateCompanyInput>,
  accessToken: string,
): Promise<Company> {
  return apiFetch<Company>('/companies/me/profile', {
    method: 'PATCH',
    accessToken,
    body: JSON.stringify(data),
  });
}

export function fetchMatchedApplications(accessToken: string): Promise<Application[]> {
  return apiFetch<Application[]>('/applications/company/matched', { accessToken });
}

export function takeApplication(
  applicationId: string,
  accessToken: string,
): Promise<Application> {
  return apiFetch<Application>(`/applications/${applicationId}/take`, {
    method: 'PATCH',
    accessToken,
  });
}
