import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiFetch } from '../lib/api-client';
import type { AuthResponse, PublicUser } from '../types/auth';

interface AuthContextValue {
  user: PublicUser | null;
  accessToken: string | null;
  isLoading: boolean;
  register: (input: {
    email: string;
    password: string;
    role?: 'entrepreneur' | 'company';
  }) => Promise<PublicUser>;
  login: (input: { email: string; password: string }) => Promise<PublicUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const { accessToken: token } = await apiFetch<{ accessToken: string }>(
          '/auth/refresh',
          { method: 'POST' },
        );
        const me = await apiFetch<PublicUser>('/auth/me', { accessToken: token });
        if (!cancelled) {
          setAccessToken(token);
          setUser(me);
        }
      } catch {
        if (!cancelled) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const register = useCallback<AuthContextValue['register']>(async (input) => {
    const result = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    setUser(result.user);
    setAccessToken(result.accessToken);
    return result.user;
  }, []);

  const login = useCallback<AuthContextValue['login']>(async (input) => {
    const result = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    setUser(result.user);
    setAccessToken(result.accessToken);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await apiFetch('/auth/logout', {
      method: 'POST',
      accessToken: accessToken ?? undefined,
    });
    setUser(null);
    setAccessToken(null);
  }, [accessToken]);

  const value = useMemo(
    () => ({ user, accessToken, isLoading, register, login, logout }),
    [user, accessToken, isLoading, register, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
