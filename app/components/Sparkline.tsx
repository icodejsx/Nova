"use client";

import { useMarketHistory } from "@/app/hooks/useAllHistory";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";

export function Sparkline({
  marketId,
  currentYesPercent,
}: {
  marketId: string;
  currentYesPercent: number;
}) {
  const { points, isLoading } = useMarketHistory(marketId);

  const data = points.map((p) => ({ yes: p.yes }));
  data.push({ yes: currentYesPercent });

  if (isLoading || data.length <= 1) {
    return (
      <div className="h-8 w-full flex items-center" aria-hidden>
        <div className="h-px w-full bg-border-strong" />
      </div>
    );
  }

  return (
    <div className="h-8 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis domain={[0, 100]} hide />
          <Line
            type="stepAfter"
            dataKey="yes"
            stroke="#1D9E75"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
