"use client";

import { use, useCallback, useState, Suspense } from "react";
import Link from "next/link";
import { BetPanel } from "./BetPanel";
import { ResolvePanel } from "./ResolvePanel";
import { OddsChart } from "./OddsChart";
import { SiteHeader } from "@/app/components/SiteHeader";
import { MarketThumb } from "@/app/components/MarketThumb";
import { CopyAddress } from "@/app/components/CopyAddress";
import { Ticker } from "@/app/components/Ticker";
import { PrivateBadge } from "@/app/components/PrivateBadge";
import { InviteGate } from "@/app/components/InviteGate";
import { useMarket, useMarkets } from "@/app/hooks/useMarkets";
import { useWallet } from "@/app/providers";
import { CONTRACT_ID, NETWORK } from "@/app/config/network";
import { canAccessMarket } from "@/app/lib/access";
import {
  formatCompactVolume,
  formatTimeLeft,
  getVolume,
  getYesPercent,
  shortAddress,
} from "@/app/lib/odds";
import { formatUsdc } from "@/app/lib/types";
import { CATEGORY_STYLES } from "@/app/lib/category";

function formatCloseTime(endTime: bigint) {
  if (endTime === BigInt(0)) return "Unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(Number(endTime) * 1000));
}

function MarketBody({ id }: { id: string }) {
  const { market, isLoading, refetch } = useMarket(id);
  const { markets } = useMarkets();
  const { address } = useWallet();
  const [accessTick, setAccessTick] = useState(0);

  const handleUpdate = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="h-5 w-40 rounded bg-white/5 mb-5" />
        <div className="h-20 max-w-2xl rounded-xl bg-white/5 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-5">
          <div className="h-80 rounded-xl animate-shimmer" />
          <div className="h-96 rounded-xl animate-shimmer" />
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl grid place-items-center bg-no-bg text-no">
          !
        </div>
        <h1 className="text-xl font-medium mb-2">Market unavailable</h1>
        <p className="text-sm text-muted mb-6">
          This market id could not be found on Nova (demo or Testnet registry).
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium focus-ring"
        >
          Browse markets
        </Link>
      </div>
    );
  }

  // accessTick forces re-check after invite redeem
  void accessTick;
  const hasAccess = canAccessMarket(market, address);

  if (market.isPrivate && !hasAccess) {
    return (
      <>
        <SiteHeader
          breadcrumb={
            <div className="text-xs text-muted truncate">
              <Link
                href="/?category=Private"
                className="hover:text-foreground transition-colors rounded focus-ring"
              >
                Private
              </Link>
              <span className="mx-2 text-border-strong">/</span>
              <span className="text-dim">Locked</span>
            </div>
          }
        />
        <div className="max-w-lg mx-auto px-6 py-16">
          <div className="flex items-center gap-2 mb-4 justify-center">
            <PrivateBadge />
            <span
              className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded border ${CATEGORY_STYLES[market.category]}`}
            >
              {market.category}
            </span>
          </div>
          <h1 className="text-lg font-semibold text-center mb-6 line-clamp-2">
            {market.question}
          </h1>
          <InviteGate
            market={market}
            onUnlocked={() => setAccessTick((t) => t + 1)}
          />
        </div>
      </>
    );
  }

  const yesPercent = getYesPercent(market.totalYes, market.totalNo);
  const noPercent = 100 - yesPercent;
  const volume = getVolume(market.totalYes, market.totalNo);
  // eslint-disable-next-line react-hooks/purity
  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  const ended = market.endTime > BigInt(0) && market.endTime <= nowSec;
  const status = market.resolved
    ? "Resolved"
    : ended
      ? "Awaiting resolution"
      : "Live";
  const explorerId = CONTRACT_ID || `demo-market-${market.id}`;

  return (
    <>
      <Ticker markets={markets.filter((m) => !m.isPrivate)} />
      <SiteHeader
        breadcrumb={
          <div className="text-xs text-muted truncate">
            <Link
              href="/"
              className="hover:text-foreground transition-colors rounded focus-ring"
            >
              Markets
            </Link>
            <span className="mx-2 text-border-strong">/</span>
            <span className="text-dim">{market.category}</span>
          </div>
        }
      />

      <section className="relative border-b border-border-subtle overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-28 left-1/4 w-96 h-64 rounded-full bg-yes/5 blur-3xl pointer-events-none"
        />
        <div className="relative max-w-6xl mx-auto px-6 py-7 sm:py-9">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span
              className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded border ${CATEGORY_STYLES[market.category]}`}
            >
              {market.category}
            </span>
            {market.isPrivate ? <PrivateBadge /> : null}
            <span
              className={`inline-flex items-center gap-1.5 font-mono-nums text-[10px] px-2 py-0.5 rounded-full ${
                market.resolved
                  ? market.outcome
                    ? "text-yes bg-yes-bg"
                    : "text-no bg-no-bg"
                  : ended
                    ? "text-amber-400 bg-amber-500/10"
                    : "text-yes bg-yes-bg"
              }`}
            >
              {!market.resolved && !ended && (
                <span className="h-1.5 w-1.5 rounded-full bg-yes" />
              )}
              {status.toUpperCase()}
            </span>
            {!market.resolved && (
              <span className="font-mono-nums text-[10px] text-muted">
                {formatTimeLeft(market.endTime, nowSec)}
              </span>
            )}
          </div>

          <div className="flex items-start gap-4 max-w-3xl mb-7">
            <MarketThumb
              address={market.id}
              question={market.question}
              category={market.category}
              size={60}
              rounded="rounded-xl"
            />
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold leading-snug">
                {market.question}
              </h1>
              <p className="text-xs text-muted mt-2">
                {market.isPrivate
                  ? "Private market — invite holders only"
                  : "Binary prediction market settled on Stellar Testnet"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-3xl">
            <div className="rounded-xl border border-yes/25 bg-yes-bg p-3.5">
              <div className="text-[10px] font-semibold text-yes mb-2">YES</div>
              <div className="font-mono-nums text-2xl font-semibold text-yes">
                {yesPercent}¢
              </div>
              <div className="text-[10px] text-muted mt-1">
                {yesPercent}% probability
              </div>
            </div>
            <div className="rounded-xl border border-no/25 bg-no-bg p-3.5">
              <div className="text-[10px] font-semibold text-no mb-2">NO</div>
              <div className="font-mono-nums text-2xl font-semibold text-no">
                {noPercent}¢
              </div>
              <div className="text-[10px] text-muted mt-1">
                {noPercent}% probability
              </div>
            </div>
            <div className="rounded-xl border border-border-subtle bg-surface p-3.5">
              <div className="text-[10px] text-muted mb-2">VOLUME</div>
              <div className="font-mono-nums text-lg text-foreground">
                {formatCompactVolume(volume)}
              </div>
              <div className="text-[10px] text-muted mt-1">USDC traded</div>
            </div>
            <div className="rounded-xl border border-border-subtle bg-surface p-3.5">
              <div className="text-[10px] text-muted mb-2">LIQUIDITY</div>
              <div className="font-mono-nums text-lg text-foreground">
                {formatCompactVolume(volume)}
              </div>
              <div className="text-[10px] text-muted mt-1">USDC in pools</div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-5 items-start">
        <div className="order-2 lg:order-1 min-w-0 space-y-5">
          <OddsChart marketId={market.id} currentYesPercent={yesPercent} />

          <section className="rounded-xl border border-border-subtle bg-surface overflow-hidden">
            <div className="p-5 border-b border-border-subtle">
              <h2 className="text-sm font-medium">Market information</h2>
              <p className="text-[11px] text-muted mt-1">
                Timing, pools and settlement details
              </p>
            </div>
            <dl className="grid sm:grid-cols-2">
              <Detail label="Status" value={status} />
              <Detail label="Visibility" value={market.isPrivate ? "Private" : "Public"} />
              <Detail label="Closes" value={formatCloseTime(market.endTime)} />
              <Detail
                label="YES pool"
                value={`${formatUsdc(market.totalYes, 3)} USDC`}
              />
              <Detail
                label="NO pool"
                value={`${formatUsdc(market.totalNo, 3)} USDC`}
              />
              <Detail
                label="Resolver"
                value={shortAddress(market.creator)}
              />
              <Detail
                label="Final outcome"
                value={
                  market.resolved ? (market.outcome ? "YES" : "NO") : "Pending"
                }
              />
            </dl>
          </section>

          <section className="rounded-xl border border-border-subtle bg-surface p-5">
            <h2 className="text-sm font-medium mb-1">How settlement works</h2>
            <p className="text-[11px] text-muted mb-5">
              Transparent rules enforced by the Nova registry contract
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <InfoStep
                number="01"
                title="Trading closes"
                text={`Orders stop at ${formatCloseTime(market.endTime)}.`}
              />
              <InfoStep
                number="02"
                title="Creator resolves"
                text="The market creator submits the final YES or NO result on-chain."
              />
              <InfoStep
                number="03"
                title="Winners claim"
                text="Winning stakes share the losing pool after the 2% platform fee."
              />
            </div>
          </section>

          <section className="rounded-xl border border-border-subtle bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-mono-nums text-[10px] text-muted mb-1">
                  REGISTRY · STELLAR TESTNET · MARKET #{market.id}
                </div>
                <CopyAddress address={explorerId} />
              </div>
              <a
                href={
                  CONTRACT_ID
                    ? `${NETWORK.explorerBase}/contract/${CONTRACT_ID}`
                    : NETWORK.explorerBase
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-2 rounded-lg border border-border-strong text-dim hover:text-foreground hover:border-muted transition-colors focus-ring"
              >
                View on Stellar Expert ↗
              </a>
            </div>
          </section>
        </div>

        <aside className="order-1 lg:order-2 lg:sticky lg:top-20">
          <Suspense fallback={<div className="h-96 rounded-xl animate-shimmer" />}>
            <BetPanel
              marketId={market.id}
              yesPercent={yesPercent}
              resolved={market.resolved}
              ended={ended}
              totalYes={market.totalYes}
              totalNo={market.totalNo}
              onBetPlaced={handleUpdate}
            />
          </Suspense>
          <ResolvePanel
            marketId={market.id}
            endTime={market.endTime}
            resolved={market.resolved}
            outcome={market.outcome}
            creator={market.creator}
            onUpdate={handleUpdate}
          />
        </aside>
      </div>
    </>
  );
}

export default function MarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <main className="min-h-screen bg-background text-foreground">
      <MarketBody id={id} />
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 border-b border-border-subtle sm:odd:border-r">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-mono-nums text-[11px] text-dim text-right">{value}</dd>
    </div>
  );
}

function InfoStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg bg-background/60 border border-border-subtle p-3.5">
      <div className="font-mono-nums text-[9px] text-accent mb-2">{number}</div>
      <div className="text-xs font-medium mb-1.5">{title}</div>
      <p className="text-[11px] leading-relaxed text-muted">{text}</p>
    </div>
  );
}
