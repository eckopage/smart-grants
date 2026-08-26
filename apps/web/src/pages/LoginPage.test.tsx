import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import { LoginPage } from './LoginPage';

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows a validation error for an invalid email', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('should not be called for /auth/me')),
    );
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByPlaceholderText('E-mail'), 'not-an-email');
    await user.type(screen.getByPlaceholderText('Hasło'), 'password');
    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    expect(
      await screen.findByText('Podaj poprawny adres e-mail'),
    ).toBeInTheDocument();
  });

  it('shows a server error message on failed login', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.toString().includes('/auth/refresh')) {
          return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) });
        }
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Nieprawidłowy e-mail lub hasło' }),
        });
      }),
    );
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByPlaceholderText('E-mail'), 'user@example.com');
    await user.type(screen.getByPlaceholderText('Hasło'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    await waitFor(() =>
      expect(
        screen.getByText('Nieprawidłowy e-mail lub hasło'),
      ).toBeInTheDocument(),
    );
  });
});
