import { supabase } from '../lib/supabase';
import { fetchRow, fetchRows, mutate } from '../lib/db';
import type { Task, TaskDetails, TaskHistoryEntry } from '../types';

const columns = 'id, title, description, object_id, assignee_id, author_id, status, created_at, updated_at';

const detailColumns =
  `${columns}, ` +
  'object:objects(id, name, address), ' +
  'assignee:profiles!tasks_assignee_id_fkey(id, role, full_name), ' +
  'author:profiles!tasks_author_id_fkey(id, role, full_name)';

export function listTasks(): Promise<Task[]> {
  return fetchRows<Task>(supabase.from('tasks').select(columns).order('created_at', { ascending: false }));
}

export function listTasksByObject(objectId: string): Promise<Task[]> {
  return fetchRows<Task>(
    supabase
      .from('tasks')
      .select(columns)
      .eq('object_id', objectId)
      .order('status')
      .order('created_at', { ascending: false }),
  );
}

export function getTask(id: string): Promise<TaskDetails> {
  return fetchRow<TaskDetails>(
    supabase.from('tasks').select(detailColumns).eq('id', id).single(),
    'Задача не найдена, либо у вас нет к ней доступа',
  );
}

export function createTask(input: {
  title: string;
  description: string | null;
  object_id: string;
  assignee_id: string | null;
  author_id: string;
}): Promise<Task> {
  return fetchRow<Task>(
    supabase
      .from('tasks')
      .insert({ ...input, status: 'Новая' })
      .select(columns)
      .single(),
  );
}

export function updateTask(
  id: string,
  patch: Partial<Pick<Task, 'title' | 'description' | 'object_id' | 'assignee_id'>>,
): Promise<Task> {
  return fetchRow<Task>(supabase.from('tasks').update(patch).eq('id', id).select(columns).single());
}

export function changeTaskStatus(id: string, target: string, comment: string | null): Promise<Task> {
  return fetchRow<Task>(
    supabase
      .rpc('change_task_status', { p_task_id: id, p_new_status: target, p_comment: comment })
      .select(columns)
      .single(),
    'Не удалось изменить статус задачи',
  );
}

export function listTaskHistory(taskId: string): Promise<TaskHistoryEntry[]> {
  return fetchRows<TaskHistoryEntry>(
    supabase
      .from('task_history')
      .select('id, task_id, user_id, old_status, new_status, comment, created_at, actor:profiles(id, role, full_name)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true }),
  );
}

export async function deleteTask(id: string): Promise<void> {
  await mutate(supabase.from('tasks').delete().eq('id', id));
}
