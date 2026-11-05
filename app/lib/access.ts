import type { MarketData } from "./types";

const ACCESS_KEY = "nova-private-access";

type AccessMap = Record<string, string[]>; // marketId -> addresses that redeemed invite

function readAccess(): AccessMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(ACCESS_KEY) ?? "{}") as AccessMap;
  } catch {
    return {};
  }
}

function writeAccess(map: AccessMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, JSON.stringify(map));
}

/** Creator always has access; public markets are open. */
export function canAccessMarket(
  market: MarketData,
  address: string | null | undefined
): boolean {
  if (!market.isPrivate) return true;
  if (!address) return false;
  const a = address.toLowerCase();
  if (market.creator && market.creator.toLowerCase() === a) return true;
  if (market.allowedAddresses?.some((x) => x.toLowerCase() === a)) return true;
  const redeemed = readAccess()[market.id] ?? [];
  return redeemed.some((x) => x.toLowerCase() === a);
}

/** Persist invite unlock for this wallet (demo / Phase B client path). */
export function grantMarketAccess(marketId: string, address: string) {
  const map = readAccess();
  const list = map[marketId] ?? [];
  if (!list.some((x) => x.toLowerCase() === address.toLowerCase())) {
    map[marketId] = [...list, address];
    writeAccess(map);
  }
}

export function redeemInvite(
  market: MarketData,
  code: string,
  address: string
): { ok: true } | { ok: false; error: string } {
  if (!market.isPrivate) return { ok: true };
  const expected = market.inviteCode?.trim().toUpperCase();
  if (!expected) {
    return { ok: false, error: "This market has no invite code configured." };
  }
  if (code.trim().toUpperCase() !== expected) {
    return { ok: false, error: "Invalid invite code." };
  }
  grantMarketAccess(market.id, address);
  return { ok: true };
}

export function generateInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "NOVA-";
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
