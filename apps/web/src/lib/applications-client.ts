import { apiFetch } from './api-client';
import type { Application } from '../types/application';
import type { RecommendedCompany } from '../types/application';

export function createApplication(
  grantId: string,
  accessToken: string,
): Promise<Application> {
  return apiFetch<Application>('/applications', {
    method: 'POST',
    accessToken,
    body: JSON.stringify({ grantId }),
  });
}

export function fetchMyApplications(accessToken: string): Promise<Application[]> {
  return apiFetch<Application[]>('/applications/me', { accessToken });
}

export function fetchRecommendedCompanies(slug: string): Promise<RecommendedCompany[]> {
  return apiFetch<RecommendedCompany[]>(`/grants/${slug}/recommended-companies`);
}
