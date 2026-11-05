"use client";

import { useEffect, useState } from "react";

export interface OddsPoint {
  t: number;
  yes: number;
}

let globalData: Record<string, OddsPoint[]> | null = null;
let fetchPromise: Promise<Record<string, OddsPoint[]>> | null = null;
let syncing = false;
let retryTimer: number | null = null;
let retryAttempt = 0;
const subscribers = new Set<() => void>();

const RETRY_DELAYS_MS = [2000, 4000, 8000, 15000, 25000];

function notify() {
  subscribers.forEach((fn) => fn());
}

function clearRetry() {
  if (retryTimer !== null) {
    window.clearTimeout(retryTimer);
    retryTimer = null;
  }
}

function scheduleRetry(delay: number) {
  clearRetry();
  retryTimer = window.setTimeout(() => {
    retryTimer = null;
    globalData = null;
    fetchAll().catch(() => {});
  }, delay);
}

async function fetchAll(force = false): Promise<Record<string, OddsPoint[]>> {
  if (!force && globalData) return globalData;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch(force ? "/api/history?refresh=1" : "/api/history")
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`History request failed (${response.status})`);
      }
      const cache = response.headers.get("x-history-cache");
      const data = (await response.json()) as Record<string, OddsPoint[]>;
      globalData = data;

      if (cache === "miss") {
        syncing = true;
        const delay = RETRY_DELAYS_MS[Math.min(retryAttempt, RETRY_DELAYS_MS.length - 1)];
        retryAttempt += 1;
        if (retryAttempt <= RETRY_DELAYS_MS.length) scheduleRetry(delay);
        else syncing = false;
      } else if (cache === "stale") {
        retryAttempt = 0;
        syncing = true;
        scheduleRetry(2000);
      } else {
        retryAttempt = 0;
        syncing = false;
        clearRetry();
      }

      notify();
      return data;
    })
    .finally(() => {
      fetchPromise = null;
    });

  return fetchPromise;
}

/** Refresh history after a confirmed trade and update every visible chart. */
export async function refreshMarketHistory() {
  globalData = null;
  syncing = true;
  notify();
  try {
    return await fetchAll(true);
  } finally {
    syncing = false;
    notify();
  }
}

export function useMarketHistory(marketAddress: string) {
  const key = marketAddress.toLowerCase();
  const [points, setPoints] = useState<OddsPoint[]>(
    () => globalData?.[key] ?? []
  );
  const [isLoading, setIsLoading] = useState(!globalData);
  const [isSyncing, setIsSyncing] = useState(syncing);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const sync = () => {
      if (!active) return;
      if (globalData) {
        setPoints(globalData[key] || []);
        setIsLoading(false);
        setError(null);
      }
      setIsSyncing(syncing);
    };

    subscribers.add(sync);
    fetchAll()
      .then((data) => {
        if (!active) return;
        setPoints(data[key] || []);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "History unavailable");
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
          setIsSyncing(syncing);
        }
      });
    return () => {
      active = false;
      subscribers.delete(sync);
    };
  }, [key]);

  return { points, isLoading, isSyncing, error };
}
