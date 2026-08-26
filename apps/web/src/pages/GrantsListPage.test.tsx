import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GrantsListPage } from './GrantsListPage';
import type { PaginatedGrants } from '../types/grant';

const samplePage: PaginatedGrants = {
  items: [
    {
      _id: '1',
      title: 'Dotacja testowa',
      slug: 'dotacja-testowa',
      description: 'Opis',
      type: 'grant',
      source: 'national',
      programme: 'FENG',
      institution: 'PARP',
      voivodeships: [],
      category: ['cyfryzacja'],
      tags: ['AI'],
      eligibleCosts: [],
      requiredDocuments: [],
      timeline: { status: 'open' },
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <GrantsListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('GrantsListPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders fetched grants', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(samplePage),
      }),
    );

    renderPage();

    await waitFor(() =>
      expect(screen.getByText('Dotacja testowa')).toBeInTheDocument(),
    );
  });

  it('shows an empty state when there are no results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [], total: 0, page: 1, limit: 20 }),
      }),
    );

    renderPage();

    await waitFor(() =>
      expect(
        screen.getByText('Brak wyników dla wybranych filtrów.'),
      ).toBeInTheDocument(),
    );
  });
});
