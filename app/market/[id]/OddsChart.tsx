"use client";

import { useMarketHistory } from "@/app/hooks/useAllHistory";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export function OddsChart({
  marketId,
  currentYesPercent,
}: {
  marketId: string;
  currentYesPercent: number;
}) {
  const { points, isSyncing, error } = useMarketHistory(marketId);

  const data =
    points.length > 0
      ? points.map((p, i) => ({
          time: `Trade ${i + 1}`,
          yes: p.yes,
          no: 100 - p.yes,
        }))
      : [
          { time: "Open", yes: currentYesPercent, no: 100 - currentYesPercent },
        ];

  data.push({
    time: "Now",
    yes: currentYesPercent,
    no: 100 - currentYesPercent,
  });

  const start = points[0]?.yes ?? currentYesPercent;
  const movement = currentYesPercent - start;
  const hasHistory = points.length > 0;

  return (
    <section
      className="rounded-xl border border-border-subtle bg-surface overflow-hidden"
      aria-label={
        hasHistory
          ? `Price history. ${points.length} trades. Yes moved ${
              movement >= 0 ? "up" : "down"
            } ${Math.abs(movement)} percentage points.`
          : `Live implied probability. Yes is ${currentYesPercent} percent.`
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
        <div>
          <h2 className="text-sm font-medium">Probability history</h2>
          <p className="text-[11px] text-muted mt-1">
            {error
              ? "Historical data is temporarily unavailable."
              : isSyncing && !hasHistory
                ? "Fetching earlier trades…"
                : hasHistory
                  ? "Implied odds after each trade"
                  : "Live implied probability"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasHistory ? (
            <>
              <span className="font-mono-nums text-[10px] text-muted">
                {points.length} {points.length === 1 ? "TRADE" : "TRADES"}
              </span>
              {movement !== 0 && (
                <span
                  className={`font-mono-nums text-[10px] px-2 py-1 rounded-full ${
                    movement >= 0 ? "text-yes bg-yes-bg" : "text-no bg-no-bg"
                  }`}
                >
                  {movement >= 0 ? "▲" : "▼"} {Math.abs(movement)} pts
                </span>
              )}
            </>
          ) : isSyncing ? (
            <span className="font-mono-nums text-[10px] text-muted">SYNCING</span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-5 px-5 mt-5 mb-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yes" />
          <span className="text-xs text-dim">Yes</span>
          <span className="font-mono-nums text-xs text-yes">
            {currentYesPercent}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-no" />
          <span className="text-xs text-dim">No</span>
          <span className="font-mono-nums text-xs text-no">
            {100 - currentYesPercent}%
          </span>
        </div>
      </div>

      <div className="h-60 px-2 pb-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 12, right: 12, bottom: 0, left: -18 }}
          >
            <defs>
              <linearGradient id="detailYesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1D9E75" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#1D9E75" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              minTickGap={35}
              tick={{ fill: "#555", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#555", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v + "%"}
            />
            <Tooltip
              contentStyle={{
                background: "#141414",
                border: "1px solid #333",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#888" }}
            />
            <Area
              type="stepAfter"
              dataKey="yes"
              name="Yes"
              stroke="#1D9E75"
              strokeWidth={2}
              fill="url(#detailYesFill)"
              dot={false}
              isAnimationActive={false}
            />
            <Area
              type="stepAfter"
              dataKey="no"
              name="No"
              stroke="#E24B4A"
              strokeWidth={1.5}
              fill="transparent"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
