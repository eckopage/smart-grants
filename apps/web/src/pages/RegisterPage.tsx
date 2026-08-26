import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { ApiError } from '../lib/api-client';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  email: z.string().email('Podaj poprawny adres e-mail'),
  password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków'),
  role: z.enum(['entrepreneur', 'company']),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'entrepreneur' },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await registerUser(values);
      void navigate('/dashboard');
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Wystąpił błąd');
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Załóż konto</h1>
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
        <div>
          <label className="mb-1 block text-sm text-slate-600">
            Rejestruję się jako
          </label>
          <select
            className="w-full rounded border border-slate-300 px-3 py-2"
            {...register('role')}
          >
            <option value="entrepreneur">Przedsiębiorca</option>
            <option value="company">Firma doradcza</option>
          </select>
        </div>
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Rejestracja…' : 'Zarejestruj się'}
        </button>
      </form>
      <p className="text-sm text-slate-600">
        Masz już konto?{' '}
        <Link to="/login" className="text-slate-900 underline">
          Zaloguj się
        </Link>
      </p>
    </main>
  );
}
