import { formatUsdc, toUsdcNumber } from "./types";

/** YES probability as a percentage (0–100). Empty pools → 50. */
export function getYesPercent(totalYes: bigint, totalNo: bigint): number {
  const total = totalYes + totalNo;
  if (total === BigInt(0)) return 50;
  const yes = toUsdcNumber(totalYes);
  const no = toUsdcNumber(totalNo);
  return Math.round((yes / (yes + no)) * 100);
}

export function getVolume(totalYes: bigint, totalNo: bigint): string {
  return formatUsdc(totalYes + totalNo, 2);
}

export function formatEndTime(endTime: bigint): string {
  const date = new Date(Number(endTime) * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTimeLeft(endTime: bigint, nowSec: bigint): string {
  if (endTime <= nowSec) return "Ended";
  const seconds = Number(endTime - nowSec);
  const days = Math.floor(seconds / 86400);
  if (days >= 1) return `${days}d left`;
  const hours = Math.floor(seconds / 3600);
  if (hours >= 1) return `${hours}h left`;
  const minutes = Math.max(1, Math.floor(seconds / 60));
  return `${minutes}m left`;
}

export function shortAddress(address?: string): string {
  if (!address) return "—";
  if (address.length < 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function formatCompactVolume(volume: string): string {
  const n = Number(volume);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(2);
}

/**
 * Payout preview (matches Hypa / contract):
 * userShare = stake / winningPool; gross = stake + share * losingPool; net = gross * 0.98
 */
export function previewNetPayout(
  stake: number,
  side: "yes" | "no",
  totalYes: number,
  totalNo: number
): number {
  if (stake <= 0) return 0;
  const winPool = side === "yes" ? totalYes + stake : totalNo + stake;
  const losePool = side === "yes" ? totalNo : totalYes;
  if (winPool <= 0) return 0;
  const gross = stake + (stake / winPool) * losePool;
  return gross * 0.98;
}
