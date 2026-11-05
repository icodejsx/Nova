"use client";

import Link from "next/link";
import type { MarketData } from "@/app/hooks/useMarkets";
import {
  formatCompactVolume,
  formatTimeLeft,
  getVolume,
  getYesPercent,
  shortAddress,
} from "@/app/lib/odds";
import { formatUsdc } from "@/app/lib/types";

/**
 * Homepage overview: platform stats, movers, settlements, how it works.
 * Complements featured + news + market grid.
 */
export function HomeOverview({ markets }: { markets: MarketData[] }) {
  // eslint-disable-next-line react-hooks/purity
  const nowSec = BigInt(Math.floor(Date.now() / 1000));

  let totalVolume = BigInt(0);
  let live = 0;
  let closingSoon = 0;
  let awaiting = 0;
  let settled = 0;

  for (const m of markets) {
    totalVolume += m.totalYes + m.totalNo;
    if (m.resolved) {
      settled++;
    } else if (m.endTime <= nowSec) {
      awaiting++;
    } else {
      live++;
      if (m.endTime - nowSec < BigInt(86400 * 3)) closingSoon++;
    }
  }

  const open = markets.filter((m) => !m.resolved && m.endTime > nowSec);
  const movers = [...open]
    .sort(
      (a, b) =>
        Number(b.totalYes + b.totalNo) - Number(a.totalYes + a.totalNo)
    )
    .slice(0, 4);

  const recentSettled = markets
    .filter((m) => m.resolved)
    .slice(0, 3);

  const stats = [
    {
      label: "Total volume",
      value: `${formatUsdc(totalVolume, 0)}`,
      unit: "USDC",
      accent: true,
    },
    { label: "Live markets", value: String(live), unit: "open" },
    { label: "Closing soon", value: String(closingSoon), unit: "< 3d" },
    { label: "Awaiting resolve", value: String(awaiting), unit: "locked" },
    { label: "Settled", value: String(settled), unit: "done" },
  ];

  return (
    <section id="overview" className="border-b border-border-subtle scroll-mt-20">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="h-1 w-1 rounded-full bg-accent" />
            <h2 className="text-sm font-semibold tracking-tight">
              Platform snapshot
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {stats.map((s) => (
              <div
                key={s.label}
                className="panel rounded-xl px-3.5 py-3.5"
              >
                <div className="text-[10px] uppercase tracking-wide text-muted mb-2">
                  {s.label}
                </div>
                <div
                  className={`font-mono-nums text-xl font-semibold leading-none ${
                    s.accent ? "text-accent" : "text-foreground"
                  }`}
                >
                  {s.value}
                </div>
                <div className="font-mono-nums text-[10px] text-muted mt-1.5">
                  {s.unit}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top volume */}
          <div className="panel rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
              <h3 className="text-sm font-semibold">Top by volume</h3>
              <span className="font-mono-nums text-[10px] text-muted">
                LIVE
              </span>
            </div>
            <ul className="divide-y divide-border-subtle">
              {movers.length === 0 ? (
                <li className="px-4 py-6 text-xs text-muted">No live markets</li>
              ) : (
                movers.map((m) => {
                  const yes = getYesPercent(m.totalYes, m.totalNo);
                  const vol = getVolume(m.totalYes, m.totalNo);
                  return (
                    <li key={m.id}>
                      <Link
                        href={`/market/${m.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors focus-ring"
                      >
                        <div className="font-mono-nums text-sm font-semibold text-yes w-12 shrink-0">
                          {yes}%
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] leading-snug line-clamp-1">
                            {m.question}
                          </div>
                          <div className="font-mono-nums text-[10px] text-muted mt-0.5">
                            {formatTimeLeft(m.endTime, nowSec)} ·{" "}
                            {formatCompactVolume(vol)} USDC
                          </div>
                        </div>
                        <span className="text-accent text-xs shrink-0">→</span>
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          {/* Settlements */}
          <div className="panel rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
              <h3 className="text-sm font-semibold">Recent settlements</h3>
              <span className="font-mono-nums text-[10px] text-muted">
                RESOLVED
              </span>
            </div>
            <ul className="divide-y divide-border-subtle">
              {recentSettled.length === 0 ? (
                <li className="px-4 py-6 text-xs text-muted">
                  No settled markets yet
                </li>
              ) : (
                recentSettled.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/market/${m.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors focus-ring"
                    >
                      <span
                        className={`font-mono-nums text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          m.outcome
                            ? "text-yes bg-yes-bg"
                            : "text-no bg-no-bg"
                        }`}
                      >
                        {m.outcome ? "YES" : "NO"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] leading-snug line-clamp-1">
                          {m.question}
                        </div>
                        <div className="font-mono-nums text-[10px] text-muted mt-0.5">
                          {shortAddress(m.creator)} resolved
                        </div>
                      </div>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* How it works */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="h-1 w-1 rounded-full bg-accent" />
            <h2 className="text-sm font-semibold tracking-tight">
              How settlement works
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              {
                n: "01",
                title: "Bet YES or NO",
                text: "Stake USDC while the market is open. Odds follow the pool.",
              },
              {
                n: "02",
                title: "Betting locks",
                text: "When the close time hits, no new bets. Positions wait.",
              },
              {
                n: "03",
                title: "Creator resolves",
                text: "The market creator submits the final YES or NO on-chain.",
              },
              {
                n: "04",
                title: "Winners claim",
                text: "Share the losing pool. A 2% fee is taken on payout.",
              },
            ].map((step) => (
              <div key={step.n} className="panel rounded-xl px-4 py-4">
                <div className="font-mono-nums text-[10px] text-accent mb-2">
                  {step.n}
                </div>
                <div className="text-sm font-medium mb-1.5">{step.title}</div>
                <p className="text-[11px] leading-relaxed text-muted">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
