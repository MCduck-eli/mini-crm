import { useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, CalendarDays, ClipboardList, Pencil, Trash2, UserRound } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useLoader } from '../hooks/useLoader';
import { deleteTask, getTask, listTaskHistory } from '../api/tasks';
import { formatDateTime } from '../lib/format';
import { StatusBadge } from '../components/StatusBadge';
import { TaskActions } from '../components/TaskActions';
import { HistoryLog } from '../components/HistoryLog';
import { TaskFormModal } from '../components/TaskFormModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { ErrorBanner } from '../components/ErrorBanner';
import { Button } from '../components/Button';
import { SkeletonCard } from '../components/SkeletonCard';
import { SkeletonLine } from '../components/SkeletonLine';

function InfoLine({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-slate-700">{value}</p>
      </div>
    </div>
  );
}

export function TaskPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const task = useLoader(() => getTask(id), [id]);
  const history = useLoader(() => listTaskHistory(id), [id]);
  const [form, setForm] = useState<'edit' | 'delete' | null>(null);

  const isManager = profile?.role === 'manager';

  function refresh() {
    task.reload();
    history.reload();
  }

  if (task.loading) {
    return (
      <div className="space-y-6">
        <SkeletonLine width="w-40" />
        <SkeletonCard />
        <SkeletonCard index={1} />
      </div>
    );
  }

  if (task.error || !task.data) {
    return (
      <div className="space-y-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Link>
        <ErrorBanner message={task.error ?? 'Задача не найдена'} onRetry={refresh} />
      </div>
    );
  }

  const current = task.data;

  return (
    <div className="space-y-6">
      <Link
        to={`/objects/${current.object_id}`}
        className="fade inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {current.object?.name ?? 'К объекту'}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="rise space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-xl font-semibold text-slate-900">{current.title}</h1>
              <StatusBadge status={current.status} />
            </div>

            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {current.description || <span className="italic text-slate-400">Описание не указано</span>}
            </p>

            <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
              <InfoLine
                icon={<UserRound className="h-4 w-4" />}
                label="Исполнитель"
                value={current.assignee?.full_name ?? <span className="italic text-slate-400">Не назначен</span>}
              />
              <InfoLine
                icon={<ClipboardList className="h-4 w-4" />}
                label="Поставил"
                value={current.author?.full_name ?? '—'}
              />
              <InfoLine
                icon={<CalendarDays className="h-4 w-4" />}
                label="Создана"
                value={formatDateTime(current.created_at)}
              />
              <InfoLine
                icon={<CalendarDays className="h-4 w-4" />}
                label="Обновлена"
                value={formatDateTime(current.updated_at)}
              />
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <TaskActions task={current} onChanged={refresh} />
            </div>

            {isManager ? (
              <div className="mt-5 flex gap-2 border-t border-slate-100 pt-5">
                <Button variant="secondary" icon={<Pencil className="h-4 w-4" />} onClick={() => setForm('edit')}>
                  Редактировать
                </Button>
                <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setForm('delete')}>
                  Удалить задачу
                </Button>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="rise rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200" style={{ animationDelay: '120ms' }}>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">История</h2>
          {history.error ? <ErrorBanner message={history.error} onRetry={history.reload} /> : null}
          <HistoryLog entries={history.data ?? []} loading={history.loading} />
        </aside>
      </div>

      {form === 'edit' ? (
        <TaskFormModal task={current} onClose={() => setForm(null)} onSaved={refresh} />
      ) : null}

      {form === 'delete' ? (
        <ConfirmModal
          title="Удалить задачу?"
          description={`Задача «${current.title}» будет удалена вместе с историей. История защищена от удаления — база может отказать.`}
          confirmLabel="Удалить"
          onClose={() => setForm(null)}
          onConfirm={async () => {
            await deleteTask(current.id);
            navigate(`/objects/${current.object_id}`);
          }}
        />
      ) : null}
    </div>
  );
}
