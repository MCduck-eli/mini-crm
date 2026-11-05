import { HistoryEntry } from './HistoryEntry';
import { SkeletonLine } from './SkeletonLine';
import { EmptyState } from './EmptyState';
import { History } from 'lucide-react';
import type { TaskHistoryEntry } from '../types';

export function HistoryLog({ entries, loading }: { entries: TaskHistoryEntry[]; loading: boolean }) {
  if (loading) {
    return (
      <ul className="space-y-4">
        <SkeletonLine width="w-1/2" />
        <SkeletonLine width="w-2/3" delay={80} />
        <SkeletonLine width="w-1/3" delay={160} />
      </ul>
    );
  }

  if (entries.length === 0) {
    return <EmptyState icon={<History className="h-5 w-5" />} title="История пуста" description="Статус ещё не менялся." />;
  }

  return (
    <ul className="space-y-4">
      {entries.map((entry, position) => (
        <HistoryEntry key={entry.id} entry={entry} index={position} />
      ))}
    </ul>
  );
}
