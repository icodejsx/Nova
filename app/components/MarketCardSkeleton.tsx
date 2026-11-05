/**
 * Mirrors MarketCard's geometry so the grid doesn't reflow when data arrives.
 */
export function MarketCardSkeleton() {
  return (
    <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden">
      <div className="h-0.5 bg-border-subtle" />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-3.5 w-16 rounded bg-white/5" />
          <div className="h-3.5 w-12 rounded bg-white/5 ml-auto" />
        </div>

        <div className="flex gap-3 mb-3.5">
          <div className="w-11 h-11 rounded-lg bg-white/5 shrink-0" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="h-3 w-full rounded bg-white/5" />
            <div className="h-3 w-3/5 rounded bg-white/5" />
          </div>
        </div>

        <div className="flex items-end justify-between mb-3">
          <div className="space-y-2">
            <div className="h-6 w-14 rounded bg-white/5" />
            <div className="h-2 w-16 rounded bg-white/5" />
          </div>
          <div className="h-6 w-24 rounded bg-white/5" />
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <div className="h-8 rounded-lg bg-white/5" />
          <div className="h-8 rounded-lg bg-white/5" />
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="h-2 w-20 rounded bg-white/5" />
          <div className="h-2 w-16 rounded bg-white/5" />
        </div>
      </div>
    </div>
  );
}
