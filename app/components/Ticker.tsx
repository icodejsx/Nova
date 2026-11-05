"use client";

import type { MarketData } from "@/app/hooks/useMarkets";
import { formatUsdc } from "@/app/lib/types";

export function Ticker({ markets }: { markets: MarketData[] }) {
  let totalVolume = BigInt(0);
  let liveCount = 0;
  // eslint-disable-next-line react-hooks/purity
  const nowSec = BigInt(Math.floor(Date.now() / 1000));

  for (const m of markets) {
    totalVolume += m.totalYes + m.totalNo;
    if (!m.resolved && m.endTime > nowSec) liveCount++;
  }

  const vol = formatUsdc(totalVolume, 2);

  const items = [
    { label: "VOL", value: `${vol} USDC`, color: "text-accent" },
    { label: "LIVE", value: String(liveCount), color: "text-foreground" },
    { label: "MARKETS", value: String(markets.length), color: "text-foreground" },
    { label: "NETWORK", value: "Stellar Testnet", color: "text-accent" },
    { label: "ASSET", value: "USDC", color: "text-foreground" },
    { label: "FEE", value: "2%", color: "text-dim" },
  ];

  const loop = [...items, ...items];

  return (
    <div className="bg-surface border-b border-border-subtle py-2 overflow-hidden whitespace-nowrap">
      <div className="inline-flex gap-8 animate-ticker font-mono-nums text-[11px]">
        {loop.map((item, i) => (
          <span key={i} className="text-muted">
            {item.label}{" "}
            <span className={item.color}>{item.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
