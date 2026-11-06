/** Mirrors MarketCard's layout so the grid doesn't jump when data arrives. */
export function MarketCardSkeleton() {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-3.5 w-16 rounded bg-white/5" />
        <div className="h-3.5 w-12 rounded bg-white/5 ml-auto" />
      </div>
      <div className="flex gap-3">
        <div className="w-11 h-11 rounded-lg bg-white/5 shrink-0" />
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="h-3.5 w-full rounded bg-white/5" />
          <div className="h-3.5 w-3/5 rounded bg-white/5" />
        </div>
      </div>
      <div className="h-8 w-24 rounded bg-white/5 mt-4 mb-3" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-10 rounded-lg bg-white/5" />
        <div className="h-10 rounded-lg bg-white/5" />
      </div>
      <div className="h-3 w-28 rounded bg-white/5 mt-3" />
    </div>
  );
}
