"use client";

import Link from "next/link";
import { MarketThumb } from "./MarketThumb";
import type { MarketData } from "@/app/hooks/useMarkets";
import {
  getYesPercent,
  getVolume,
  formatEndTime,
  formatTimeLeft,
  formatCompactVolume,
} from "@/app/lib/odds";
import { PrivateBadge } from "./PrivateBadge";

export function MarketCard({ market }: { market: MarketData }) {
  const yesPercent = getYesPercent(market.totalYes, market.totalNo);
  const noPercent = 100 - yesPercent;
  const volume = getVolume(market.totalYes, market.totalNo);

  // eslint-disable-next-line react-hooks/purity
  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  const ended = market.endTime <= nowSec;

  return (
    <div
      className={`h-full flex flex-col rounded-xl border border-border-subtle bg-surface p-4 transition-colors hover:border-border-strong ${
        market.resolved ? "opacity-70 hover:opacity-100" : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-3 text-xs text-muted">
        <span>{market.category}</span>
        {market.isPrivate ? <PrivateBadge /> : null}
        <span className="ml-auto">
          {market.resolved
            ? formatEndTime(market.endTime)
            : formatTimeLeft(market.endTime, nowSec)}
        </span>
      </div>

      <Link
        href={`/market/${market.id}`}
        className="flex gap-3 items-start rounded-lg focus-ring"
      >
        <MarketThumb
          address={market.id}
          question={market.question}
          category={market.category}
        />
        <div className="text-[15px] font-medium leading-snug text-foreground min-h-[3.25rem] line-clamp-3">
          {market.question}
        </div>
      </Link>

      <div className="mt-4 mb-3 flex items-baseline gap-2">
        <span className="font-mono-nums text-3xl font-semibold text-foreground">
          {yesPercent}%
        </span>
        <span className="text-xs text-muted">chance of yes</span>
      </div>

      {market.resolved ? (
        <div
          className={`text-center py-2.5 text-sm font-medium rounded-lg ${
            market.outcome ? "bg-yes-bg text-yes" : "bg-no-bg text-no"
          }`}
        >
          {market.outcome ? "Resolved: Yes" : "Resolved: No"}
        </div>
      ) : ended ? (
        <div className="text-center py-2.5 text-sm rounded-lg border border-border-strong text-muted">
          Waiting for result
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/market/${market.id}?side=yes`}
            aria-label={`Buy yes at ${yesPercent} cents`}
            className="py-2.5 text-center rounded-lg bg-yes-bg text-yes text-sm font-semibold hover:bg-yes hover:text-white transition-colors focus-ring"
          >
            Yes {yesPercent}¢
          </Link>
          <Link
            href={`/market/${market.id}?side=no`}
            aria-label={`Buy no at ${noPercent} cents`}
            className="py-2.5 text-center rounded-lg bg-no-bg text-no text-sm font-semibold hover:bg-no hover:text-white transition-colors focus-ring"
          >
            No {noPercent}¢
          </Link>
        </div>
      )}

      <div className="mt-auto pt-3 text-xs text-muted">
        {formatCompactVolume(volume)} USDC traded
      </div>
    </div>
  );
}
