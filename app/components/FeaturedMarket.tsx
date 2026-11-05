"use client";

import Link from "next/link";
import { useMarketHistory } from "@/app/hooks/useAllHistory";
import type { MarketData } from "@/app/hooks/useMarkets";
import {
  getYesPercent,
  getVolume,
  formatTimeLeft,
  formatCompactVolume,
} from "@/app/lib/odds";
import { CATEGORY_STYLES } from "@/app/lib/category";
import { MarketThumb } from "./MarketThumb";
import { ProbabilityOrbit } from "./ProbabilityOrbit";
import { PrivateBadge } from "./PrivateBadge";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function FeaturedMarket({ market }: { market: MarketData }) {
  const yesPercent = getYesPercent(market.totalYes, market.totalNo);
  const noPercent = 100 - yesPercent;
  const volume = getVolume(market.totalYes, market.totalNo);
  const category = market.category;

  // eslint-disable-next-line react-hooks/purity
  const nowSec = BigInt(Math.floor(Date.now() / 1000));

  const { points, isSyncing } = useMarketHistory(market.id);

  const data = points.map((p, i) => ({
    time: `#${i + 1}`,
    yes: p.yes,
    no: 100 - p.yes,
  }));
  data.push({ time: "Now", yes: yesPercent, no: noPercent });

  const startPercent = points.length > 0 ? points[0].yes : 50;
  const change = yesPercent - startPercent;

  return (
    <section className="relative border-b border-border-subtle overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-accent/10 blur-3xl"
      />

      <div className="relative max-w-6xl mx-auto px-6 py-10 sm:py-12">
        <div className="flex items-center gap-3 mb-7">
          <span className="flex items-center gap-1.5 font-mono-nums text-[10px] tracking-widest text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            FEATURED
          </span>
          <span className="h-px flex-1 bg-border-subtle" />
          <span className="font-mono-nums text-[10px] text-muted">
            HIGHEST VOLUME
          </span>
        </div>

        <div className="panel rounded-2xl p-5 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.05fr)] gap-8 lg:gap-10 items-center">
            <div className="flex justify-center lg:justify-start">
              <ProbabilityOrbit yesPercent={yesPercent} size={196} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span
                  className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded border ${CATEGORY_STYLES[category]}`}
                >
                  {category}
                </span>
                {market.isPrivate ? <PrivateBadge /> : null}
                <span className="font-mono-nums text-[10px] text-muted">
                  {formatTimeLeft(market.endTime, nowSec)}
                </span>
                {points.length > 0 && change !== 0 && (
                  <span
                    className={`font-mono-nums text-[10px] px-1.5 py-0.5 rounded ${
                      change > 0 ? "text-yes bg-yes-bg" : "text-no bg-no-bg"
                    }`}
                  >
                    {change > 0 ? "+" : ""}
                    {change} pts
                  </span>
                )}
              </div>

              <Link
                href={`/market/${market.id}`}
                className="flex items-start gap-4 mb-5 rounded-lg focus-ring group"
              >
                <MarketThumb
                  address={market.id}
                  question={market.question}
                  category={category}
                  size={56}
                  rounded="rounded-xl"
                />
                <h2 className="text-xl sm:text-2xl font-semibold leading-snug group-hover:text-white transition-colors">
                  {market.question}
                </h2>
              </Link>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted mb-6">
                <span>
                  Volume{" "}
                  <span className="font-mono-nums text-foreground">
                    {formatCompactVolume(volume)} USDC
                  </span>
                </span>
                <span>
                  Liquidity{" "}
                  <span className="font-mono-nums text-foreground">
                    {formatCompactVolume(volume)} USDC
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 max-w-md">
                <Link
                  href={`/market/${market.id}?side=yes`}
                  className="text-center py-3.5 text-xs font-semibold rounded-xl bg-yes-bg border border-yes/30 text-yes hover:bg-yes hover:border-yes hover:text-white transition-colors focus-ring"
                >
                  Buy yes · {yesPercent}¢
                </Link>
                <Link
                  href={`/market/${market.id}?side=no`}
                  className="text-center py-3.5 text-xs font-semibold rounded-xl bg-no-bg border border-no/25 text-no hover:bg-no hover:border-no hover:text-white transition-colors focus-ring"
                >
                  Buy no · {noPercent}¢
                </Link>
              </div>
            </div>

            <div className="h-56 rounded-xl border border-border-subtle bg-background/60 p-3">
              <div className="flex items-center justify-between px-2 pt-1 mb-1">
                <span className="text-[10px] text-muted uppercase tracking-wide">
                  Probability
                </span>
                <span className="font-mono-nums text-[10px] text-dim">
                  {points.length > 0 ? `${points.length} trades` : "Live"}
                </span>
              </div>
              {data.length > 1 ? (
                <ResponsiveContainer width="100%" height="85%">
                  <AreaChart
                    data={data}
                    margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
                  >
                    <defs>
                      <linearGradient id="yesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3dba7e" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#3dba7e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="time"
                      tick={{ fill: "#3a4254", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: "#3a4254", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => v + "%"}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#11151d",
                        border: "1px solid #2a3142",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      labelStyle={{ color: "#8b92a1" }}
                    />
                    <Area
                      type="stepAfter"
                      dataKey="yes"
                      name="Yes"
                      stroke="#3dba7e"
                      strokeWidth={2}
                      fill="url(#yesFill)"
                      dot={false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[85%] flex flex-col items-center justify-center gap-1.5 text-center px-4">
                  <span className="font-mono-nums text-2xl text-yes">
                    {yesPercent}%
                  </span>
                  <span className="text-[11px] text-muted">
                    {isSyncing
                      ? "Loading trade history…"
                      : "Implied probability"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
