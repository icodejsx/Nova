import type { Category } from "@/app/lib/category";

export interface MarketData {
  /** Registry market id (stringified u32) or demo id. */
  id: string;
  question: string;
  endTime: bigint;
  resolved: boolean;
  outcome: boolean;
  totalYes: bigint;
  totalNo: bigint;
  creator?: string;
  category: Category;
  /** Phase B: invite-only market */
  isPrivate?: boolean;
  /** Shareable invite code (demo / off-chain metadata) */
  inviteCode?: string;
  /** Explicit allowlist (G… addresses); creator always has access */
  allowedAddresses?: string[];
}

const ZERO = BigInt(0);
const SCALE = BigInt(10_000_000); // 7 decimals

/** Parse human USDC → base units (7 decimals). */
export function parseUsdc(amount: string): bigint {
  const trimmed = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return ZERO;
  const [whole, frac = ""] = trimmed.split(".");
  const padded = (frac + "0000000").slice(0, 7);
  return BigInt(whole) * SCALE + BigInt(padded || "0");
}

/** Format base units → display string. */
export function formatUsdc(amount: bigint, digits = 2): string {
  const neg = amount < ZERO;
  const abs = neg ? -amount : amount;
  const whole = abs / SCALE;
  const frac = abs % SCALE;
  const fracStr = frac.toString().padStart(7, "0").slice(0, digits);
  return `${neg ? "-" : ""}${whole}.${fracStr}`;
}

export function toUsdcNumber(amount: bigint): number {
  return Number(amount) / 1e7;
}
