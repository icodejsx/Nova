"use client";

import { Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/app/components/SiteHeader";
import { FeaturedMarket } from "@/app/components/FeaturedMarket";
import { MarketCardSkeleton } from "@/app/components/MarketCardSkeleton";
import { useMarkets } from "@/app/hooks/useMarkets";
import { CATEGORIES } from "@/app/lib/category";
import { MarketCard } from "./components/MarketCard";
import { LivePulse } from "@/app/components/LivePulse";
import { HomeOverview } from "@/app/components/HomeOverview";

function MarketsSkeleton() {
  return (
    <>
      <section className="max-w-6xl mx-auto px-6 py-10 border-b border-border-subtle">
        <div className="h-72 rounded-2xl bg-white/5 animate-shimmer" />
      </section>
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <MarketCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </>
  );
}

function HomeContent() {
  const { markets, isLoading } = useMarkets();
  const router = useRouter();
  const searchParams = useSearchParams();

  const filter = searchParams.get("category") ?? "All";

  const setFilter = useCallback(
    (next: string) => {
      router.replace(
        next === "All" ? "/" : `/?category=${encodeURIComponent(next)}`,
        { scroll: false }
      );
    },
    [router]
  );

  // eslint-disable-next-line react-hooks/purity
  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  const publicLive = markets.filter(
    (m) => !m.isPrivate && !m.resolved && m.endTime > nowSec
  );
  const featured =
    publicLive.length > 0
      ? publicLive.reduce((best, m) =>
          m.totalYes + m.totalNo > best.totalYes + best.totalNo ? m : best
        )
      : markets.find((m) => !m.isPrivate) ?? markets[0];

  const rest = markets.filter((m) => m.id !== featured?.id);
  const openPublic = rest.filter((m) => !m.resolved && !m.isPrivate);
  const privateOpen = rest.filter((m) => !m.resolved && m.isPrivate);
  const resolved = rest.filter((m) => m.resolved && !m.isPrivate);

  const counts: Record<string, number> = {
    All: openPublic.length,
    Private: privateOpen.length,
    Resolved: resolved.length,
  };
  for (const c of CATEGORIES) {
    counts[c] = openPublic.filter((m) => m.category === c).length;
  }

  const visibleFilters = [
    "All",
    ...(counts.Private > 0 ? ["Private"] : []),
    ...CATEGORIES.filter((c) => counts[c] > 0),
    ...(counts.Resolved > 0 ? ["Resolved"] : []),
  ];

  const filtered =
    filter === "Resolved"
      ? resolved
      : filter === "Private"
        ? privateOpen
        : filter === "All"
          ? openPublic
          : openPublic.filter((m) => m.category === filter);

  if (isLoading) return <MarketsSkeleton />;

  if (markets.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="text-xl mb-2">No markets yet</div>
        <p className="text-sm text-muted mb-6">Be the first to ask a question.</p>
        <Link
          href="/create"
          className="inline-block text-sm px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg transition-colors font-semibold focus-ring"
        >
          Create a market
        </Link>
      </div>
    );
  }

  return (
    <>
      {featured && <FeaturedMarket market={featured} />}
      <HomeOverview markets={markets.filter((m) => !m.isPrivate)} />

      <div className="sticky top-14 z-20 bg-background/90 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {visibleFilters.map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                aria-pressed={isActive}
                className={`text-sm px-3 py-1.5 rounded-full whitespace-nowrap border transition-colors focus-ring ${
                  isActive
                    ? "bg-foreground text-background border-foreground font-medium"
                    : "border-border-strong text-dim hover:text-foreground hover:border-muted"
                }`}
              >
                {f}
                <span className={`ml-1.5 text-xs ${isActive ? "opacity-60" : "text-muted"}`}>
                  {counts[f]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section className="max-w-6xl mx-auto px-6 py-8 pb-16">
        {filter === "Private" ? (
          <p className="text-sm text-muted mb-5">
            Invite-only markets. Open one and enter the code from its creator.
          </p>
        ) : null}
        {filtered.length === 0 ? (
          <div className="py-16 text-center rounded-xl border border-border-subtle bg-surface">
            <div className="text-sm text-dim mb-1">No markets here yet</div>
            <button
              onClick={() => setFilter("All")}
              className="text-sm text-accent hover:underline focus-ring rounded"
            >
              Show all markets
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        )}
      </section>

      <LivePulse />
    </>
  );
}

export default function Home() {
  return (
    <main className="bg-background text-foreground">
      <SiteHeader />
      <Suspense fallback={<MarketsSkeleton />}>
        <HomeContent />
      </Suspense>
    </main>
  );
}
