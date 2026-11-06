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
  label = "Roqqu price",
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
      className="text-xs text-muted"
      title={
        prices.source === "mock"
          ? (prices.note ?? "Demo price")
          : "Live price via Roqqu API"
      }
    >
      {label}: {asset.label} <span className="font-mono-nums text-foreground">${fmt(usd)}</span>{" "}
      (₦{fmt(usd * prices.ngnPerUsd)})
    </span>
  );
}
