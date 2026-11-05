import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { friendlyError } from '../lib/db';

export function ConfirmModal({
  title,
  description,
  confirmLabel,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-slate-600">{description}</p>
      {error ? <p className="mt-3 text-xs font-medium text-rose-600">{error}</p> : null}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Отмена
        </Button>
        <Button variant="danger" loading={busy} onClick={() => void run()}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
