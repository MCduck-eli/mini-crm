export function SkeletonLine({ width = 'w-full', delay = 0 }: { width?: string; delay?: number }) {
  return (
    <div
      className={`h-3 animate-pulse rounded-full bg-slate-200 ${width}`}
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
