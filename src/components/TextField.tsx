import { forwardRef } from 'react';
import { FieldShell, inputClass } from './FieldShell';
import type { InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, id, ...rest },
  ref,
) {
  return (
    <FieldShell label={label} error={error} htmlFor={id}>
      <input ref={ref} id={id} {...rest} className={inputClass} />
    </FieldShell>
  );
});
