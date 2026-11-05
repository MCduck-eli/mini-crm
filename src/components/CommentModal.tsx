import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import { Button } from './Button';
import { TextAreaField } from './TextAreaField';

interface CommentForm {
  comment: string;
}

export function CommentModal({
  title,
  submitLabel,
  loading,
  error,
  onClose,
  onSubmit,
}: {
  title: string;
  submitLabel: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (comment: string) => void;
}) {
  const { register, handleSubmit, formState } = useForm<CommentForm>({ mode: 'onChange' });

  return (
    <Modal title={title} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit((values) => onSubmit(values.comment.trim()))}>
        <TextAreaField
          id="action-comment"
          label="Комментарий (обязательно)"
          placeholder="Что нужно исправить или принять"
          rows={5}
          error={formState.errors.comment?.message}
          {...register('comment', {
            required: 'Комментарий обязателен для отправки на доработку',
            validate: (value) => (value && value.trim().length >= 3) || 'Минимум 3 символа',
          })}
        />
        {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" variant="danger" loading={loading} disabled={!formState.isValid}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
