import { SkeletonLine } from './SkeletonLine';

export function SkeletonCard({ index = 0 }: { index?: number }) {
  return (
    <div
      className="rise rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <SkeletonLine width="w-2/5" />
      <div className="mt-3 space-y-2">
        <SkeletonLine width="w-3/4" delay={60} />
        <SkeletonLine width="w-1/3" delay={120} />
      </div>
      <div className="mt-5 flex gap-2">
        <SkeletonLine width="w-16" delay={180} />
        <SkeletonLine width="w-16" delay={240} />
      </div>
    </div>
  );
}
