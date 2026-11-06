"use client";

import { useEffect, useState } from "react";
import type { RoqquPrices } from "@/app/lib/roqqu/types";

/** Roqqu prices + NGN rate, refreshed every 60s. */
export function useRoqquPrices(): RoqquPrices | null {
  const [prices, setPrices] = useState<RoqquPrices | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/roqqu/prices");
        if (!res.ok) return;
        const json = (await res.json()) as RoqquPrices;
        if (!cancelled) setPrices(json);
      } catch {
        /* keep last value */
      }
    };
    void load();
    const t = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, []);

  return prices;
}
