import { forwardRef } from 'react';
import { FieldShell, inputClass } from './FieldShell';
import type { TextareaHTMLAttributes } from 'react';

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { label, error, id, rows = 4, ...rest },
  ref,
) {
  return (
    <FieldShell label={label} error={error} htmlFor={id}>
      <textarea ref={ref} id={id} rows={rows} {...rest} className={`${inputClass} resize-y`} />
    </FieldShell>
  );
});
