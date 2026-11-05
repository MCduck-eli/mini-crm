import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'positive' | 'danger' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600',
  secondary: 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 focus-visible:outline-slate-400',
  positive: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-emerald-600',
  danger: 'bg-white text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50 focus-visible:outline-rose-600',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:outline-slate-400',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ variant = 'primary', loading = false, icon, children, className = '', ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
