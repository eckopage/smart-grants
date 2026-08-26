import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { ApiError } from '../lib/api-client';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  email: z.string().email('Podaj poprawny adres e-mail'),
  password: z.string().min(1, 'Podaj hasło'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await login(values);
      void navigate('/dashboard');
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Wystąpił błąd');
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Zaloguj się</h1>
      <form
        noValidate
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        className="flex flex-col gap-3"
      >
        <div>
          <input
            type="email"
            placeholder="E-mail"
            className="w-full rounded border border-slate-300 px-3 py-2"
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <input
            type="password"
            placeholder="Hasło"
            className="w-full rounded border border-slate-300 px-3 py-2"
            {...register('password')}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Logowanie…' : 'Zaloguj się'}
        </button>
      </form>
      <p className="text-sm text-slate-600">
        Nie masz konta?{' '}
        <Link to="/register" className="text-slate-900 underline">
          Zarejestruj się
        </Link>
      </p>
    </main>
  );
}
