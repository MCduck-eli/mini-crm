import { ChevronRight, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { formatDate } from '../lib/format';
import type { Task } from '../types';

interface TaskRowProps {
  task: Task;
  assigneeName?: string | null;
  objectName?: string | null;
  index?: number;
}

export function TaskRow({ task, assigneeName, objectName, index = 0 }: TaskRowProps) {
  return (
    <Link
      to={`/tasks/${task.id}`}
      className="rise flex items-center gap-4 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200 transition duration-200 hover:bg-slate-50"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{task.title}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          {objectName ? <span>{objectName}</span> : null}
          {assigneeName ? (
            <span className="inline-flex items-center gap-1">
              <UserRound className="h-3.5 w-3.5" />
              {assigneeName}
            </span>
          ) : (
            <span className="italic text-slate-400">не назначен</span>
          )}
          <span>{formatDate(task.created_at)}</span>
        </p>
      </div>
      <StatusBadge status={task.status} />
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
    </Link>
  );
}
