import { apiFetch } from './api-client';
import type { Grant, GrantFilters, PaginatedGrants } from '../types/grant';

export function fetchGrants(filters: GrantFilters): Promise<PaginatedGrants> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.type) params.set('type', filters.type);
  if (filters.status) params.set('status', filters.status);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  filters.voivodeships?.forEach((v) => params.append('voivodeships', v));
  filters.category?.forEach((c) => params.append('category', c));
  filters.tags?.forEach((t) => params.append('tags', t));

  return apiFetch<PaginatedGrants>(`/grants?${params.toString()}`);
}

export function fetchGrantBySlug(slug: string): Promise<Grant> {
  return apiFetch<Grant>(`/grants/${slug}`);
}
