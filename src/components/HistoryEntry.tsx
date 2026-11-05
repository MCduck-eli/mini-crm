import { ArrowRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { formatDateTime, initials } from '../lib/format';
import { ROLE_LABELS } from '../lib/roles';
import type { TaskHistoryEntry } from '../types';

export function HistoryEntry({ entry, index = 0 }: { entry: TaskHistoryEntry; index?: number }) {
  return (
    <li className="rise flex gap-3" style={{ animationDelay: `${index * 120}ms` }}>
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
        {entry.actor ? initials(entry.actor.full_name) : '—'}
      </span>
      <div className="min-w-0 flex-1 border-b border-slate-100 pb-4">
        <p className="text-sm text-slate-800">
          <span className="font-medium">{entry.actor?.full_name ?? 'Система'}</span>
          <span className="text-slate-500"> · {entry.actor ? ROLE_LABELS[entry.actor.role] : ''}</span>
        </p>
        <p className="mt-1.5 flex flex-wrap items-center gap-2">
          {entry.old_status ? (
            <>
              <StatusBadge status={entry.old_status} />
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </>
          ) : null}
          <StatusBadge status={entry.new_status} />
        </p>
        {entry.comment ? (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-100">
            {entry.comment}
          </p>
        ) : null}
        <p className="mt-1.5 text-xs text-slate-400">{formatDateTime(entry.created_at)}</p>
      </div>
    </li>
  );
}
