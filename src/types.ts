export type Role = 'manager' | 'worker';

export type TaskStatus = 'Новая' | 'В работе' | 'На проверке' | 'Принята' | 'На доработке';

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  created_at?: string;
}

export interface AppObject {
  id: string;
  name: string;
  address: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  object_id: string;
  assignee_id: string | null;
  author_id: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export interface TaskDetails extends Task {
  object: AppObject | null;
  assignee: Profile | null;
  author: Profile | null;
}

export interface TaskHistoryEntry {
  id: string;
  task_id: string;
  user_id: string;
  old_status: TaskStatus | null;
  new_status: TaskStatus;
  comment: string | null;
  created_at: string;
  actor: Profile | null;
}
