"use client";

import { useMemo } from "react";
import { DEMO_MARKETS } from "@/app/lib/demo-markets";
import type { MarketData } from "@/app/lib/types";
import { USE_DEMO } from "@/app/config/network";

export type { MarketData };

/**
 * Lists markets. Phase A scaffold: demo data until CONTRACT_ID is set.
 * Later: Soroban RPC reads against nova-registry.
 */
export function useMarkets() {
  const markets = useMemo(() => {
    if (USE_DEMO) return DEMO_MARKETS;
    // Contract wiring lands after deploy — keep demo fallback for now.
    return DEMO_MARKETS;
  }, []);

  return {
    markets,
    isLoading: false,
  };
}

export function useMarket(id: string): {
  market: MarketData | undefined;
  isLoading: boolean;
  refetch: () => void;
} {
  const { markets, isLoading } = useMarkets();
  const market = markets.find((m) => m.id === id);
  return {
    market,
    isLoading,
    refetch: () => {},
  };
}
