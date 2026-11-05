import { forwardRef } from 'react';
import { FieldShell, inputClass } from './FieldShell';
import type { SelectHTMLAttributes } from 'react';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  loading?: boolean;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, error, id, children, loading = false, ...rest },
  ref,
) {
  return (
    <FieldShell label={label} error={error} htmlFor={id}>
      <select ref={ref} id={id} {...rest} disabled={rest.disabled || loading} className={inputClass}>
        {children}
      </select>
      {loading ? <p className="text-xs text-slate-400">Загружаем список…</p> : null}
    </FieldShell>
  );
});
