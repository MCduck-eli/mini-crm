import { useState } from 'react';
import { Building2, FolderPlus, Plus } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useLoader } from '../hooks/useLoader';
import { listObjects } from '../api/objects';
import { listTasks } from '../api/tasks';
import { groupTasksByObject } from '../lib/grouping';
import { ObjectCard } from '../components/ObjectCard';
import { ObjectFormModal } from '../components/ObjectFormModal';
import { TaskFormModal } from '../components/TaskFormModal';
import { StatusSummary } from '../components/StatusSummary';
import { SkeletonCard } from '../components/SkeletonCard';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { Button } from '../components/Button';

export function ObjectsPage() {
  const { profile } = useAuth();
  const objects = useLoader(listObjects, []);
  const tasks = useLoader(listTasks, []);
  const [form, setForm] = useState<'object' | 'task' | null>(null);

  const isManager = profile?.role === 'manager';
  const allTasks = tasks.data ?? [];
  const grouped = groupTasksByObject(allTasks);

  function refresh() {
    objects.reload();
    tasks.reload();
  }

  return (
    <div className="space-y-6">
      <div className="fade flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Объекты</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isManager
              ? 'Все объекты компании и задачи по ним.'
              : 'Объекты, на которых у вас есть назначенные задачи.'}
          </p>
        </div>
        {isManager ? (
          <div className="flex gap-2">
            <Button variant="secondary" icon={<FolderPlus className="h-4 w-4" />} onClick={() => setForm('object')}>
              Создать объект
            </Button>
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setForm('task')}>
              Новая задача
            </Button>
          </div>
        ) : null}
      </div>

      {allTasks.length > 0 ? <StatusSummary tasks={allTasks} /> : null}

      {tasks.error || objects.error ? (
        <ErrorBanner message={tasks.error ?? objects.error ?? 'Ошибка загрузки'} onRetry={refresh} />
      ) : null}

      {objects.loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard index={0} />
          <SkeletonCard index={1} />
          <SkeletonCard index={2} />
        </div>
      ) : null}

      {!objects.loading && (objects.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Building2 className="h-5 w-5" />}
          title={isManager ? 'Пока нет объектов' : 'Нет объектов с вашими задачами'}
          description={isManager ? 'Создайте первый объект, чтобы ставить задачи.' : 'Как только вам назначат задачу, объект появится здесь.'}
        />
      ) : null}

      {!objects.loading && (objects.data?.length ?? 0) > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(objects.data ?? []).map((object, position) => (
            <ObjectCard key={object.id} object={object} tasks={grouped.get(object.id) ?? []} index={position} />
          ))}
        </div>
      ) : null}

      {form === 'object' ? (
        <ObjectFormModal object={null} onClose={() => setForm(null)} onSaved={refresh} />
      ) : null}

      {form === 'task' ? <TaskFormModal task={null} onClose={() => setForm(null)} onSaved={refresh} /> : null}
    </div>
  );
}
