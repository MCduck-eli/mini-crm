import { ListChecks } from 'lucide-react';
import { useLoader } from '../hooks/useLoader';
import { listTasks } from '../api/tasks';
import { listObjects } from '../api/objects';
import { STATUSES } from '../lib/status';
import { TaskRow } from '../components/TaskRow';
import { ErrorBanner } from '../components/ErrorBanner';
import { EmptyState } from '../components/EmptyState';
import { SkeletonCard } from '../components/SkeletonCard';
import { StatusBadge } from '../components/StatusBadge';
import type { Task } from '../types';

export function MyTasksPage() {
  const tasks = useLoader(listTasks, []);
  const objects = useLoader(listObjects, []);

  const objectNames = new Map((objects.data ?? []).map((object) => [object.id, object.name]));
  const items = tasks.data ?? [];

  function refresh() {
    tasks.reload();
    objects.reload();
  }

  return (
    <div className="space-y-6">
      <div className="fade">
        <h1 className="text-2xl font-semibold text-slate-900">Мои задачи</h1>
        <p className="mt-1 text-sm text-slate-500">Задачи, назначенные на вас. Откройте задачу, чтобы изменить статус.</p>
      </div>

      {tasks.error ? <ErrorBanner message={tasks.error} onRetry={refresh} /> : null}

      {tasks.loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard index={1} />
        </div>
      ) : null}

      {!tasks.loading && items.length === 0 ? (
        <EmptyState icon={<ListChecks className="h-5 w-5" />} title="Задач нет" description="Постановщик ещё ничего не назначил." />
      ) : null}

      {!tasks.loading
        ? STATUSES.map((status) => {
            const bucket = items.filter((task: Task) => task.status === status);
            if (bucket.length === 0) return null;
            return (
              <section key={status} className="space-y-3">
                <div className="flex items-center gap-2">
                  <StatusBadge status={status} />
                  <span className="text-xs text-slate-400">{bucket.length}</span>
                </div>
                <div className="space-y-3">
                  {bucket.map((task, position) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      index={position}
                      objectName={objectNames.get(task.object_id) ?? null}
                    />
                  ))}
                </div>
              </section>
            );
          })
        : null}
    </div>
  );
}
