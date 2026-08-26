import { apiFetch } from './api-client';
import type { Plan } from '../types/plan';

export function fetchPlans(audience: 'entrepreneur' | 'company'): Promise<Plan[]> {
  return apiFetch<Plan[]>(`/plans?audience=${audience}`);
}
