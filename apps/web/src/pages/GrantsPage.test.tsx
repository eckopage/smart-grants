import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GrantsPage } from './GrantsPage';
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

const emptyPage: PaginatedGrants = { items: [], total: 0, page: 1, limit: 20 };

function stubFetch(grantsResponse: PaginatedGrants) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      if (url.toString().includes('/geo/wojewodztwa.geojson')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ type: 'FeatureCollection', features: [] }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(grantsResponse),
      });
    }),
  );
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <GrantsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('GrantsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders fetched grants in list view', async () => {
    stubFetch(samplePage);
    const user = userEvent.setup();

    renderPage();
    await user.click(screen.getByRole('button', { name: 'Lista' }));

    await waitFor(() =>
      expect(screen.getByText('Dotacja testowa')).toBeInTheDocument(),
    );
  });

  it('shows an empty state when there are no results', async () => {
    stubFetch(emptyPage);

    renderPage();

    await waitFor(() =>
      expect(
        screen.getByText('Brak wyników dla wybranych filtrów.'),
      ).toBeInTheDocument(),
    );
  });

  it('defaults to the map view', () => {
    stubFetch(emptyPage);

    renderPage();

    expect(screen.getByRole('button', { name: 'Mapa' })).toHaveClass(
      'bg-slate-900',
    );
  });
});
