import { countByStatus } from '../lib/grouping';
import { STATUS_STYLES } from '../lib/status';
import type { Task } from '../types';

export function StatusSummary({ tasks }: { tasks: Task[] }) {
  const counts = countByStatus(tasks);
  const entries = Object.entries(counts).filter(([, value]) => value > 0);

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([status, value]) => (
        <span key={status} className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${STATUS_STYLES[status as Task['status']]}`}>
          {status}: {value}
        </span>
      ))}
    </div>
  );
}
