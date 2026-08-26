import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import { PricingPage } from './PricingPage';
import type { Plan } from '../types/plan';

const plans: Plan[] = [
  {
    _id: '1',
    key: 'starter',
    audience: 'entrepreneur',
    name: 'Starter',
    priceMonthly: 39,
    priceYearly: 390,
    currency: 'PLN',
    limits: {
      maxFavorites: 10,
      leadContactsPerMonth: 2,
      maxTeamAccounts: 1,
      exportData: false,
      apiAccess: false,
    },
  },
];

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          <PricingPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PricingPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders plans fetched from the API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.toString().includes('/auth/refresh')) {
          return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(plans),
        });
      }),
    );

    renderPage();

    await waitFor(() => expect(screen.getByText('Starter')).toBeInTheDocument());
    expect(screen.getByText(/39/)).toBeInTheDocument();
  });
});
