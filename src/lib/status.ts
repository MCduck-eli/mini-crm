import type { Profile, TaskStatus } from '../types';

export const STATUSES: TaskStatus[] = ['Новая', 'В работе', 'На проверке', 'Принята', 'На доработке'];

export const STATUS_STYLES: Record<TaskStatus, string> = {
  Новая: 'bg-slate-100 text-slate-700 ring-slate-200',
  'В работе': 'bg-blue-50 text-blue-700 ring-blue-200',
  'На проверке': 'bg-amber-50 text-amber-700 ring-amber-200',
  Принята: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'На доработке': 'bg-rose-50 text-rose-700 ring-rose-200',
};

export type ActionTone = 'primary' | 'positive' | 'warning';

export interface TaskAction {
  label: string;
  target: TaskStatus;
  tone: ActionTone;
  requiresComment: boolean;
}

export function actionsFor(profile: Profile, task: { status: TaskStatus; assignee_id: string | null }): TaskAction[] {
  const isOwnTask = task.assignee_id === profile.id;

  if (profile.role === 'worker') {
    if (!isOwnTask) return [];
    if (task.status === 'Новая') return [{ label: 'Взять в работу', target: 'В работе', tone: 'primary', requiresComment: false }];
    if (task.status === 'На доработке') {
      return [{ label: 'Исправить и взять в работу', target: 'В работе', tone: 'primary', requiresComment: false }];
    }
    if (task.status === 'В работе') {
      return [{ label: 'Отправить на проверку', target: 'На проверке', tone: 'primary', requiresComment: false }];
    }
    return [];
  }

  if (task.status !== 'На проверке') return [];
  return [
    { label: 'Принять работу', target: 'Принята', tone: 'positive', requiresComment: false },
    { label: 'Отправить на доработку', target: 'На доработке', tone: 'warning', requiresComment: true },
  ];
}

export function statusIndex(status: TaskStatus): number {
  return STATUSES.indexOf(status);
}
