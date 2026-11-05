import { useState } from 'react';
import { ArrowLeft, Building2, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useLoader } from '../hooks/useLoader';
import { deleteObject, getObject } from '../api/objects';
import { listTasksByObject } from '../api/tasks';
import { listProfiles } from '../api/profiles';
import { TaskRow } from '../components/TaskRow';
import { Button } from '../components/Button';
import { ErrorBanner } from '../components/ErrorBanner';
import { SkeletonCard } from '../components/SkeletonCard';
import { SkeletonLine } from '../components/SkeletonLine';
import { EmptyState } from '../components/EmptyState';
import { StatusSummary } from '../components/StatusSummary';
import { ObjectFormModal } from '../components/ObjectFormModal';
import { TaskFormModal } from '../components/TaskFormModal';
import { ConfirmModal } from '../components/ConfirmModal';

export function ObjectPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const object = useLoader(() => getObject(id), [id]);
  const tasks = useLoader(() => listTasksByObject(id), [id]);
  const profiles = useLoader(listProfiles, []);
  const [form, setForm] = useState<'edit' | 'task' | 'delete' | null>(null);

  const isManager = profile?.role === 'manager';
  const names = new Map((profiles.data ?? []).map((person) => [person.id, person.full_name]));
  const items = tasks.data ?? [];

  function refresh() {
    object.reload();
    tasks.reload();
  }

  if (object.loading) {
    return (
      <div className="space-y-6">
        <SkeletonLine width="w-32" />
        <SkeletonCard />
        <SkeletonCard index={1} />
      </div>
    );
  }

  if (object.error || !object.data) {
    return (
      <div className="space-y-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />К объектам
        </Link>
        <ErrorBanner message={object.error ?? 'Объект не найден'} onRetry={refresh} />
      </div>
    );
  }

  const current = object.data;

  return (
    <div className="space-y-6">
      <Link to="/" className="fade inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        К объектам
      </Link>

      <section className="rise rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-400">
              <Building2 className="h-3.5 w-3.5" />
              Объект
            </p>
            <h1 className="mt-1.5 text-xl font-semibold text-slate-900">{current.name}</h1>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              {current.address}
            </p>
          </div>
          {isManager ? (
            <div className="flex gap-2">
              <Button variant="secondary" icon={<Pencil className="h-4 w-4" />} onClick={() => setForm('edit')}>
                Изменить
              </Button>
              <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setForm('delete')}>
                Удалить
              </Button>
            </div>
          ) : null}
        </div>
        {items.length > 0 ? (
          <div className="mt-5 border-t border-slate-100 pt-5">
            <StatusSummary tasks={items} />
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Задачи объекта</h2>
          {isManager ? (
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setForm('task')}>
              Новая задача
            </Button>
          ) : null}
        </div>

        {tasks.error ? <ErrorBanner message={tasks.error} onRetry={tasks.reload} /> : null}

        {tasks.loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard index={1} />
          </div>
        ) : null}

        {!tasks.loading && items.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-5 w-5" />}
            title="Задач нет"
            description={isManager ? 'Поставьте первую задачу по этому объекту.' : 'По этому объекту у вас пока нет задач.'}
          />
        ) : null}

        <div className="space-y-3">
          {items.map((task, position) => (
            <TaskRow
              key={task.id}
              task={task}
              index={position}
              assigneeName={task.assignee_id ? (names.get(task.assignee_id) ?? null) : null}
            />
          ))}
        </div>
      </section>

      {form === 'edit' ? (
        <ObjectFormModal
          object={current}
          onClose={() => setForm(null)}
          onSaved={() => {
            object.reload();
            setForm(null);
          }}
        />
      ) : null}

      {form === 'task' ? (
        <TaskFormModal task={null} defaultObjectId={current.id} onClose={() => setForm(null)} onSaved={refresh} />
      ) : null}

      {form === 'delete' ? (
        <ConfirmModal
          title="Удалить объект?"
          description={`Объект «${current.name}» и все его задачи будут удалены. Если по задачам есть история, база запретит удаление.`}
          confirmLabel="Удалить"
          onClose={() => setForm(null)}
          onConfirm={async () => {
            await deleteObject(current.id);
            navigate('/');
          }}
        />
      ) : null}
    </div>
  );
}
