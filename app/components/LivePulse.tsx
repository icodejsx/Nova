"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CATEGORY_STYLES, type Category } from "@/app/lib/category";
import type { PulseItem, PulseKind } from "@/app/lib/pulse";

type Tab = "all" | "news" | "market";

function timeAgo(ts: number) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function KindBadge({ kind }: { kind: PulseKind }) {
  return (
    <span className="font-mono-nums text-[9px] uppercase tracking-wide text-muted">
      {kind === "news" ? "News" : "Market"}
    </span>
  );
}

function PulseCard({ item }: { item: PulseItem }) {
  const body = (
    <>
      <div className="flex items-center gap-2 mb-2">
        <KindBadge kind={item.kind} />
        <span
          className={`text-[9px] font-medium uppercase px-1.5 py-0.5 rounded border ${CATEGORY_STYLES[item.category as Category]}`}
        >
          {item.category}
        </span>
        <span className="ml-auto font-mono-nums text-[10px] text-muted">
          {timeAgo(item.publishedAt)}
        </span>
      </div>
      <p className="text-[13px] leading-snug text-foreground/90 line-clamp-3 group-hover:text-foreground transition-colors">
        {item.title}
      </p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted truncate">{item.source}</span>
        {item.relatedMarketId && (
          <span className="text-[10px] text-accent shrink-0">
            {item.relatedLabel ?? "Open"} →
          </span>
        )}
      </div>
    </>
  );

  const className =
    "group block min-w-[270px] max-w-[290px] snap-start rounded-xl border border-border-subtle bg-surface p-4 hover:border-border-strong hover:bg-surface-hover transition-all hover:-translate-y-0.5 focus-ring";

  if (item.relatedMarketId) {
    return (
      <Link href={`/market/${item.relatedMarketId}`} className={className}>
        {body}
      </Link>
    );
  }

  if (item.url) {
    return (
      <a href={item.url} target="_blank" rel="noreferrer" className={className}>
        {body}
      </a>
    );
  }

  return <div className={className}>{body}</div>;
}

export function LivePulse() {
  const [items, setItems] = useState<PulseItem[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/pulse");
        if (!res.ok) throw new Error("Unavailable");
        const data = (await res.json()) as {
          items: PulseItem[];
          updatedAt: number;
        };
        if (!active) return;
        setItems(data.items ?? []);
        setUpdatedAt(data.updatedAt ?? Date.now());
        setError(null);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Unavailable");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    const id = window.setInterval(load, 5 * 60_000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  const visible = useMemo(() => {
    if (tab === "all") return items;
    return items.filter((i) => i.kind === tab);
  }, [items, tab]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "news", label: "News" },
    { id: "market", label: "Markets" },
  ];

  return (
    <section id="pulse" className="border-b border-border-subtle scroll-mt-20">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-yes" />
              <span className="font-mono-nums text-[10px] uppercase tracking-wider text-muted">
                Live
              </span>
            </div>
            <h2 className="text-lg font-semibold tracking-tight">News & activity</h2>
            <p className="text-xs text-muted mt-1 max-w-md">
              Headlines from the wire, plus odds moves on Nova.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 rounded-lg border border-border-strong p-0.5">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-colors focus-ring ${
                    tab === t.id
                      ? "bg-foreground text-background font-medium"
                      : "text-dim hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {updatedAt && (
              <span className="font-mono-nums text-[10px] text-muted hidden sm:inline">
                {timeAgo(updatedAt)} ago
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[260px] h-[120px] rounded-xl bg-white/5 animate-shimmer"
              />
            ))}
          </div>
        ) : error && items.length === 0 ? (
          <div className="rounded-xl border border-border-subtle bg-surface px-5 py-6 text-center text-sm text-muted">
            News feed unavailable right now.
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory">
            {visible.map((item) => (
              <PulseCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
