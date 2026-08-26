import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomePage } from './HomePage';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('HomePage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the heading', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'ok', timestamp: '' }),
      }),
    );

    renderWithProviders(<HomePage />);

    expect(
      screen.getByRole('heading', { name: 'Smart Grants' }),
    ).toBeInTheDocument();
  });

  it('shows the API status once the health check resolves', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'ok', timestamp: '' }),
      }),
    );

    renderWithProviders(<HomePage />);

    await waitFor(() =>
      expect(screen.getByTestId('api-status')).toHaveTextContent(
        'API status: ok',
      ),
    );
  });

  it('shows an error state when the health check fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    renderWithProviders(<HomePage />);

    await waitFor(() =>
      expect(screen.getByTestId('api-status')).toHaveTextContent(
        'Brak połączenia z API',
      ),
    );
  });
});
