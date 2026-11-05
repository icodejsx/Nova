"use client";

import Link from "next/link";
import type { MarketData } from "@/app/hooks/useMarkets";
import {
  formatCompactVolume,
  formatTimeLeft,
  getVolume,
  getYesPercent,
} from "@/app/lib/odds";
import { formatUsdc } from "@/app/lib/types";

/**
 * Homepage snapshot — volume, live count, closing soon, recent settlements.
 */
export function HomeSnapshot({ markets }: { markets: MarketData[] }) {
  // eslint-disable-next-line react-hooks/purity
  const nowSec = BigInt(Math.floor(Date.now() / 1000));

  let totalVolume = BigInt(0);
  const live: MarketData[] = [];
  const closing: MarketData[] = [];
  const settled: MarketData[] = [];

  for (const m of markets) {
    totalVolume += m.totalYes + m.totalNo;
    if (m.resolved) {
      settled.push(m);
    } else if (m.endTime > nowSec) {
      live.push(m);
      if (m.endTime - nowSec < BigInt(86400 * 3)) closing.push(m);
    }
  }

  closing.sort((a, b) => Number(a.endTime - b.endTime));
  settled.sort((a, b) => Number(b.endTime - a.endTime));

  const stats = [
    {
      label: "Total volume",
      value: `${formatUsdc(totalVolume, 0)}`,
      unit: "USDC",
      accent: true,
    },
    {
      label: "Live markets",
      value: String(live.length),
      unit: "open",
      accent: false,
    },
    {
      label: "Closing soon",
      value: String(closing.length),
      unit: "≤ 3 days",
      accent: false,
    },
    {
      label: "Settled",
      value: String(settled.length),
      unit: "resolved",
      accent: false,
    },
  ];

  return (
    <section className="border-b border-border-subtle">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <p className="font-mono-nums text-[10px] uppercase tracking-wider text-accent mb-1.5">
              Overview
            </p>
            <h2 className="text-lg font-semibold tracking-tight">
              What&apos;s happening on Nova
            </h2>
            <p className="text-xs text-muted mt-1">
              Live protocol stats, markets closing soon, and recent outcomes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {stats.map((s) => (
            <div
              key={s.label}
              className="panel rounded-xl px-4 py-4 border-l-2 border-l-accent/40"
            >
              <div className="text-[10px] uppercase tracking-wide text-muted mb-2">
                {s.label}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`font-mono-nums text-2xl font-semibold tracking-tight ${
                    s.accent ? "text-accent" : "text-foreground"
                  }`}
                >
                  {s.value}
                </span>
                <span className="text-[11px] text-muted">{s.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="panel rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
              <h3 className="text-sm font-medium">Closing soon</h3>
              <span className="font-mono-nums text-[10px] text-muted">
                Next {Math.min(closing.length, 4)}
              </span>
            </div>
            <ul className="divide-y divide-border-subtle">
              {closing.length === 0 ? (
                <li className="px-4 py-6 text-xs text-muted">
                  No markets closing in the next 3 days.
                </li>
              ) : (
                closing.slice(0, 4).map((m) => {
                  const yes = getYesPercent(m.totalYes, m.totalNo);
                  return (
                    <li key={m.id}>
                      <Link
                        href={`/market/${m.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors focus-ring"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] leading-snug line-clamp-1">
                            {m.question}
                          </div>
                          <div className="font-mono-nums text-[10px] text-muted mt-1">
                            {formatTimeLeft(m.endTime, nowSec)} ·{" "}
                            {formatCompactVolume(
                              getVolume(m.totalYes, m.totalNo)
                            )}{" "}
                            USDC
                          </div>
                        </div>
                        <div className="font-mono-nums text-sm text-yes shrink-0">
                          {yes}%
                        </div>
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          <div className="panel rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
              <h3 className="text-sm font-medium">Recently settled</h3>
              <span className="font-mono-nums text-[10px] text-muted">
                Latest {Math.min(settled.length, 4)}
              </span>
            </div>
            <ul className="divide-y divide-border-subtle">
              {settled.length === 0 ? (
                <li className="px-4 py-6 text-xs text-muted">
                  No settled markets yet.
                </li>
              ) : (
                settled.slice(0, 4).map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/market/${m.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors focus-ring"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] leading-snug line-clamp-1">
                          {m.question}
                        </div>
                        <div className="font-mono-nums text-[10px] text-muted mt-1">
                          {formatCompactVolume(
                            getVolume(m.totalYes, m.totalNo)
                          )}{" "}
                          USDC volume
                        </div>
                      </div>
                      <span
                        className={`font-mono-nums text-[10px] px-2 py-1 rounded-full shrink-0 ${
                          m.outcome
                            ? "bg-yes-bg text-yes"
                            : "bg-no-bg text-no"
                        }`}
                      >
                        {m.outcome ? "YES" : "NO"}
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
