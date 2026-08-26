import { apiFetch } from './api-client';

export function checkout(
  planKey: string,
  billingPeriod: 'monthly' | 'yearly',
  accessToken: string,
): Promise<{ redirectUrl: string }> {
  return apiFetch<{ redirectUrl: string }>('/payments/checkout', {
    method: 'POST',
    accessToken,
    body: JSON.stringify({ planKey, billingPeriod }),
  });
}
