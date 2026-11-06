"use client";

import Link from "next/link";
import type { MarketData } from "@/app/hooks/useMarkets";
import {
  formatCompactVolume,
  formatTimeLeft,
  getVolume,
  getYesPercent,
} from "@/app/lib/odds";
import { toUsdcNumber } from "@/app/lib/types";

const STEPS = [
  {
    title: "Pick YES or NO",
    text: "Stake while the market is open. The price moves with the crowd.",
  },
  {
    title: "Trading closes",
    text: "At the close time no new trades are accepted. Positions wait for the result.",
  },
  {
    title: "Result is posted",
    text: "Nova (or the creator, for private markets) submits the final YES or NO.",
  },
  {
    title: "Winners cash out",
    text: "Winners share the losing pool. A 2% fee is taken from the payout.",
  },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold tracking-tight mb-5">{children}</h2>
  );
}

/** Platform stats, top markets, recent results and how settlement works. */
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

  const recentSettled = markets.filter((m) => m.resolved).slice(0, 4);

  const stats = [
    {
      label: "Total traded",
      value: Math.round(toUsdcNumber(totalVolume)).toLocaleString("en-US"),
      unit: "USDC",
      accent: true,
    },
    { label: "Live markets", value: String(live), unit: "open now" },
    { label: "Closing soon", value: String(closingSoon), unit: "within 3 days" },
    { label: "Awaiting result", value: String(awaiting), unit: "trading closed" },
    { label: "Settled", value: String(settled), unit: "paid out" },
  ];

  return (
    <section className="border-b border-border-subtle">
      <div className="max-w-6xl mx-auto px-6 py-14 space-y-14">
        <div>
          <SectionTitle>Platform snapshot</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="panel rounded-xl p-5">
                <div className="text-sm text-muted mb-3">{s.label}</div>
                <div
                  className={`font-mono-nums text-3xl font-semibold leading-none ${
                    s.accent ? "text-accent" : "text-foreground"
                  }`}
                >
                  {s.value}
                </div>
                <div className="text-xs text-muted mt-3">{s.unit}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="panel rounded-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-border-subtle">
              <h3 className="text-base font-semibold">Top by volume</h3>
            </div>
            <ul className="divide-y divide-border-subtle">
              {movers.length === 0 ? (
                <li className="px-6 py-8 text-sm text-muted">No live markets</li>
              ) : (
                movers.map((m) => {
                  const yes = getYesPercent(m.totalYes, m.totalNo);
                  const vol = getVolume(m.totalYes, m.totalNo);
                  return (
                    <li key={m.id}>
                      <Link
                        href={`/market/${m.id}`}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-surface-hover transition-colors focus-ring"
                      >
                        <div className="font-mono-nums text-base font-semibold text-yes w-12 shrink-0">
                          {yes}%
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm leading-snug line-clamp-1">
                            {m.question}
                          </div>
                          <div className="text-xs text-muted mt-1.5">
                            {formatTimeLeft(m.endTime, nowSec)} ·{" "}
                            {formatCompactVolume(vol)} USDC
                          </div>
                        </div>
                        <span className="text-muted shrink-0" aria-hidden>
                          →
                        </span>
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          <div className="panel rounded-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-border-subtle">
              <h3 className="text-base font-semibold">Recent results</h3>
            </div>
            <ul className="divide-y divide-border-subtle">
              {recentSettled.length === 0 ? (
                <li className="px-6 py-8 text-sm text-muted">
                  No settled markets yet
                </li>
              ) : (
                recentSettled.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/market/${m.id}`}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-surface-hover transition-colors focus-ring"
                    >
                      <span
                        className={`w-12 shrink-0 text-center text-xs font-semibold py-1 rounded ${
                          m.outcome ? "text-yes bg-yes-bg" : "text-no bg-no-bg"
                        }`}
                      >
                        {m.outcome ? "YES" : "NO"}
                      </span>
                      <div className="min-w-0 flex-1 text-sm leading-snug line-clamp-2">
                        {m.question}
                      </div>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div>
          <SectionTitle>How settlement works</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((step, i) => (
              <div key={step.title} className="panel rounded-xl p-6">
                <div className="font-mono-nums text-sm text-accent mb-4">
                  {i + 1}
                </div>
                <div className="text-base font-medium mb-2">{step.title}</div>
                <p className="text-sm leading-relaxed text-muted">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
