import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import { Button } from './Button';
import { TextField } from './TextField';
import { TextAreaField } from './TextAreaField';
import { SelectField } from './SelectField';
import { useLoader } from '../hooks/useLoader';
import { useAuth } from '../auth/AuthContext';
import { listObjects } from '../api/objects';
import { listWorkers } from '../api/profiles';
import { createTask, updateTask } from '../api/tasks';
import { friendlyError } from '../lib/db';
import type { Task } from '../types';

interface TaskFormValues {
  title: string;
  description: string;
  object_id: string;
  assignee_id: string;
}

export function TaskFormModal({
  task,
  defaultObjectId,
  onClose,
  onSaved,
}: {
  task: Task | null;
  defaultObjectId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { profile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const objects = useLoader(listObjects, []);
  const workers = useLoader(listWorkers, []);

  const { register, handleSubmit, formState } = useForm<TaskFormValues>({
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      object_id: task?.object_id ?? defaultObjectId ?? '',
      assignee_id: task?.assignee_id ?? '',
    },
  });

  async function save(values: TaskFormValues) {
    if (!profile) return;
    setSaving(true);
    setError(null);
    const payload = {
      title: values.title.trim(),
      description: values.description.trim() ? values.description.trim() : null,
      object_id: values.object_id,
      assignee_id: values.assignee_id ? values.assignee_id : null,
    };
    try {
      if (task) await updateTask(task.id, payload);
      else await createTask({ ...payload, author_id: profile.id });
      onSaved();
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={task ? 'Редактировать задачу' : 'Новая задача'} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit(save)}>
        <TextField
          id="task-title"
          label="Название задачи"
          placeholder="Смонтировать стояки отопления"
          error={formState.errors.title?.message}
          {...register('title', { required: 'Укажите название задачи' })}
        />
        <TextAreaField
          id="task-description"
          label="Описание"
          rows={4}
          placeholder="Что нужно сделать, материалы, сроки"
          {...register('description')}
        />
        <SelectField
          id="task-object"
          label="Объект"
          loading={objects.loading}
          error={formState.errors.object_id?.message}
          {...register('object_id', { required: 'Выберите объект' })}
        >
          <option value="">— выберите объект —</option>
          {(objects.data ?? []).map((object) => (
            <option key={object.id} value={object.id}>
              {object.name}
            </option>
          ))}
        </SelectField>
        <SelectField id="task-assignee" label="Исполнитель" loading={workers.loading} {...register('assignee_id')}>
          <option value="">Не назначен</option>
          {(workers.data ?? []).map((worker) => (
            <option key={worker.id} value={worker.id}>
              {worker.full_name}
            </option>
          ))}
        </SelectField>
        {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" loading={saving}>
            {task ? 'Сохранить' : 'Поставить задачу'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
