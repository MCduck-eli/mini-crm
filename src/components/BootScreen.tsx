import { SkeletonCard } from './SkeletonCard';

export function BootScreen() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard index={0} />
        <SkeletonCard index={1} />
        <SkeletonCard index={2} />
      </div>
    </div>
  );
}
