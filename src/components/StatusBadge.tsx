import { STATUS_STYLES } from '../lib/status';
import type { TaskStatus } from '../types';

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
