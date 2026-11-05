import { AlertTriangle } from 'lucide-react';

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="pop flex items-start gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">
        <p>{message}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 rounded-lg bg-white px-3 py-1 font-medium text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100"
          >
            Повторить
          </button>
        ) : null}
      </div>
    </div>
  );
}
