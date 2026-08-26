import { apiFetch } from './api-client';
import type { Grant, PaginatedGrants } from '../types/grant';
import type { Plan } from '../types/plan';
import type { Company } from '../types/company';

// --- Grants ---

export function adminFetchGrants(accessToken: string): Promise<PaginatedGrants> {
  return apiFetch<PaginatedGrants>('/admin/grants?limit=200', { accessToken });
}

export function adminFetchGrant(id: string, accessToken: string): Promise<Grant> {
  return apiFetch<Grant>(`/admin/grants/${id}`, { accessToken });
}

export function adminCreateGrant(
  data: Record<string, unknown>,
  accessToken: string,
): Promise<Grant> {
  return apiFetch<Grant>('/admin/grants', {
    method: 'POST',
    accessToken,
    body: JSON.stringify(data),
  });
}

export function adminUpdateGrant(
  id: string,
  data: Record<string, unknown>,
  accessToken: string,
): Promise<Grant> {
  return apiFetch<Grant>(`/admin/grants/${id}`, {
    method: 'PATCH',
    accessToken,
    body: JSON.stringify(data),
  });
}

export function adminDeleteGrant(id: string, accessToken: string): Promise<void> {
  return apiFetch<void>(`/admin/grants/${id}`, { method: 'DELETE', accessToken });
}

// --- Plans ---

export function adminFetchPlans(accessToken: string): Promise<Plan[]> {
  return apiFetch<Plan[]>('/admin/plans', { accessToken });
}

export function adminCreatePlan(
  data: Record<string, unknown>,
  accessToken: string,
): Promise<Plan> {
  return apiFetch<Plan>('/admin/plans', {
    method: 'POST',
    accessToken,
    body: JSON.stringify(data),
  });
}

export function adminUpdatePlan(
  key: string,
  data: Record<string, unknown>,
  accessToken: string,
): Promise<Plan> {
  return apiFetch<Plan>(`/admin/plans/${key}`, {
    method: 'PATCH',
    accessToken,
    body: JSON.stringify(data),
  });
}

export function adminDeletePlan(key: string, accessToken: string): Promise<void> {
  return apiFetch<void>(`/admin/plans/${key}`, { method: 'DELETE', accessToken });
}

// --- Companies ---

export function adminFetchCompanies(accessToken: string): Promise<Company[]> {
  return apiFetch<Company[]>('/admin/companies', { accessToken });
}

export function adminSetCompanyVerified(
  id: string,
  isVerified: boolean,
  accessToken: string,
): Promise<Company> {
  return apiFetch<Company>(`/admin/companies/${id}/verify`, {
    method: 'PATCH',
    accessToken,
    body: JSON.stringify({ isVerified }),
  });
}

// --- Ingestion ---

export interface IngestionSourceResult {
  source: string;
  found: number;
  created: number;
  updated: number;
  error?: string;
}

export interface IngestionRun {
  _id: string;
  startedAt: string;
  finishedAt?: string;
  results: IngestionSourceResult[];
}

export function adminFetchIngestionRuns(accessToken: string): Promise<IngestionRun[]> {
  return apiFetch<IngestionRun[]>('/admin/ingestion/runs', { accessToken });
}

export function adminTriggerIngestion(accessToken: string): Promise<{ jobId: string }> {
  return apiFetch('/admin/ingestion/run', { method: 'POST', accessToken });
}

// --- Users ---

export interface AdminUser {
  _id: string;
  email: string;
  role: string;
  companyName?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export function adminFetchUsers(accessToken: string): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>('/admin/users', { accessToken });
}

// --- Subscriptions ---

export interface AdminSubscription {
  _id: string;
  userId: { email: string; role: string } | string;
  planId: { key: string; name: string; priceMonthly: number; priceYearly: number; currency: string } | string;
  planKey: string;
  billingPeriod: 'monthly' | 'yearly';
  status: string;
  currentPeriodEnd?: string;
}

export function adminFetchSubscriptions(accessToken: string): Promise<AdminSubscription[]> {
  return apiFetch<AdminSubscription[]>('/admin/subscriptions', { accessToken });
}
