import { STATUSES } from './status';
import type { Task, TaskStatus } from '../types';

export function groupTasksByObject(tasks: Task[]): Map<string, Task[]> {
  const groups = new Map<string, Task[]>();
  for (const task of tasks) {
    const list = groups.get(task.object_id);
    if (list) list.push(task);
    else groups.set(task.object_id, [task]);
  }
  return groups;
}

export function countByStatus(tasks: Task[]): Record<TaskStatus, number> {
  const counts = Object.fromEntries(STATUSES.map((status) => [status, 0])) as Record<TaskStatus, number>;
  for (const task of tasks) counts[task.status] += 1;
  return counts;
}
