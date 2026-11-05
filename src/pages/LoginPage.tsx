import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { HardHat } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { friendlyError } from '../lib/db';

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const { session, signIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<LoginFormValues>();

  if (session) return <Navigate to="/" replace />;

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';

  async function onSubmit(values: LoginFormValues) {
    setError(null);
    try {
      await signIn(values.email.trim(), values.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="rise w-full max-w-sm rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-white">
            <HardHat className="h-5 w-5" />
          </span>
          <div>
            <p className="text-base font-semibold text-slate-900">Объекты и задачи</p>
            <p className="text-xs text-slate-500">Mini-CRM строительной компании</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            id="login-email"
            type="email"
            autoComplete="username"
            label="Электронная почта"
            placeholder="manager@stroyka.ru"
            error={formState.errors.email?.message}
            {...register('email', {
              required: 'Введите почту',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Неверный формат почты' },
            })}
          />
          <TextField
            id="login-password"
            type="password"
            autoComplete="current-password"
            label="Пароль"
            placeholder="••••••••"
            error={formState.errors.password?.message}
            {...register('password', { required: 'Введите пароль' })}
          />
          {error ? (
            <p className="pop rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 ring-1 ring-rose-200">{error}</p>
          ) : null}
          <Button type="submit" className="w-full" loading={formState.isSubmitting}>
            Войти
          </Button>
        </form>
      </div>
    </div>
  );
}
