import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { actionsFor, type TaskAction } from '../lib/status';
import { changeTaskStatus } from '../api/tasks';
import { friendlyError } from '../lib/db';
import { Button } from './Button';
import { CommentModal } from './CommentModal';
import type { Task, TaskDetails } from '../types';

export function TaskActions({ task, onChanged }: { task: Task | TaskDetails; onChanged: () => void }) {
  const { profile } = useAuth();
  const [pending, setPending] = useState<TaskAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;
  const actions = actionsFor(profile, task);
  if (actions.length === 0) return null;

  async function run(action: TaskAction, comment: string | null) {
    setLoading(true);
    setError(null);
    try {
      await changeTaskStatus(task.id, action.target, comment);
      setPending(null);
      onChanged();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.target + action.label}
            variant={action.tone === 'primary' ? 'primary' : action.tone === 'positive' ? 'positive' : 'danger'}
            loading={loading}
            onClick={() => (action.requiresComment ? setPending(action) : void run(action, null))}
          >
            {action.label}
          </Button>
        ))}
      </div>

      {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}

      {pending ? (
        <CommentModal
          title={pending.label}
          submitLabel={pending.label}
          loading={loading}
          error={error}
          onClose={() => setPending(null)}
          onSubmit={(comment) => void run(pending, comment)}
        />
      ) : null}
    </div>
  );
}
