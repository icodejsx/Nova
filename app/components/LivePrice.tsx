"use client";

import { useRoqquPrices } from "@/app/hooks/useRoqquPrices";
import { detectAsset } from "@/app/lib/roqqu/types";

function fmt(n: number) {
  return n >= 100
    ? n.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : n.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

/** Live Roqqu reference price for crypto markets (renders nothing otherwise). */
export function LivePrice({
  question,
  label = "Roqqu live",
}: {
  question: string;
  label?: string;
}) {
  const prices = useRoqquPrices();
  const asset = detectAsset(question);
  if (!asset || !prices) return null;
  const usd = prices.usd[asset.token];
  if (!usd) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/5 px-2.5 py-1 font-mono-nums text-[10px] text-accent"
      title={
        prices.source === "mock"
          ? (prices.note ?? "Demo price")
          : "Live price via Roqqu API"
      }
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          prices.source === "roqqu" ? "bg-yes" : "bg-muted"
        }`}
      />
      {label} · {asset.label} ${fmt(usd)}
      <span className="text-muted">
        · ₦{fmt(usd * prices.ngnPerUsd)}
      </span>
      {prices.source === "mock" ? <span className="text-muted">· demo</span> : null}
    </span>
  );
}
