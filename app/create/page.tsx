"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useIsCreator } from "@/app/hooks/useIsCreator";
import { useAccount } from "@/app/hooks/useCredit";
import { useWallet } from "@/app/providers";
import { ConnectWallet } from "@/app/components/ConnectWallet";
import { SiteHeader } from "@/app/components/SiteHeader";
import { MarketThumb } from "@/app/components/MarketThumb";
import { PrivateBadge } from "@/app/components/PrivateBadge";
import {
  SELECTABLE_CATEGORIES,
  CATEGORY_STYLES,
  CATEGORY_HINTS,
  type Category,
} from "@/app/lib/category";
import { generateInviteCode, grantMarketAccess } from "@/app/lib/access";

const INPUT_CLASS =
  "w-full bg-background border border-border-strong rounded-lg px-3.5 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-muted transition-colors";

const PRESETS = [
  { label: "24 hours", hours: 24 },
  { label: "7 days", hours: 24 * 7 },
  { label: "30 days", hours: 24 * 30 },
  { label: "90 days", hours: 24 * 90 },
] as const;

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatCloseLabel(isoLocal: string) {
  if (!isoLocal) return "Not set";
  const d = new Date(isoLocal);
  if (Number.isNaN(d.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export default function CreatePage() {
  const { isConnected, address } = useWallet();
  const router = useRouter();
  const { isCreator, isAdmin } = useIsCreator();
  const { loaded } = useAccount();

  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState<Category>("Crypto");
  const [endDate, setEndDate] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [wantsPrivate, setWantsPrivate] = useState(false);
  // Public markets are curated by the Nova team; everyone else creates private ones.
  const isPrivate = wantsPrivate || !isAdmin;
  const [validationError, setValidationError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [createdInvite, setCreatedInvite] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function applyPreset(hours: number) {
    const d = new Date(Date.now() + hours * 60 * 60 * 1000);
    setEndDate(toLocalInputValue(d));
    setValidationError("");
  }

  function createMarket() {
    const trimmed = question.trim();
    if (!trimmed) {
      setValidationError("Add a clear yes/no question.");
      return;
    }
    if (trimmed.length < 12) {
      setValidationError("Question is too short to be resolvable.");
      return;
    }
    if (!category) {
      setValidationError("Select a category.");
      return;
    }
    if (!endDate) {
      setValidationError("Pick when betting should close.");
      return;
    }

    const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
    if (Number.isNaN(endTimestamp)) {
      setValidationError("Invalid close time.");
      return;
    }
    if (endTimestamp <= Math.floor(Date.now() / 1000) + 60) {
      setValidationError("Close time must be at least one minute from now.");
      return;
    }

    void resolutionNotes;
    setValidationError("");
    setIsPending(true);

    const invite = isPrivate ? generateInviteCode() : null;
    // Scaffold: invoke registry.create_market via Freighter after deploy.
    window.setTimeout(() => {
      const id = isPrivate ? "16" : "1";
      if (invite && address) {
        grantMarketAccess(id, address);
      }
      setIsPending(false);
      setIsSuccess(true);
      setCreatedId(id);
      setCreatedInvite(invite);
    }, 700);
  }

  const canSubmit =
    question.trim().length >= 12 && !!endDate && !!category && isConnected;
  const charCount = question.trim().length;
  const previewId = useMemo(() => "preview", []);

  async function copyInvite() {
    if (!createdInvite) return;
    try {
      await navigator.clipboard.writeText(createdInvite);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {!loaded ? (
        <div className="max-w-md mx-auto px-6 py-24" aria-busy />
      ) : !isCreator ? (
        <div className="max-w-md mx-auto px-6 py-24 text-center">
          <div className="text-lg mb-2">Sign in to create a market</div>
          <p className="text-sm text-muted mb-6">
            Create private, invite-only markets for your friends or community.
            Public markets are curated by the Nova team so every question has a
            clear, resolvable outcome.
          </p>
          <div className="flex flex-col items-center gap-3">
            <ConnectWallet />
            <Link
              href="/"
              className="inline-block text-sm px-5 py-2.5 rounded-lg border border-border-strong text-dim hover:text-foreground transition-colors focus-ring"
            >
              Back to markets
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-6 py-10 pb-20">
          <Link
            href="/"
            className="text-[13px] text-muted hover:text-dim transition-colors rounded focus-ring"
          >
            ← Back to markets
          </Link>

          <div className="mt-5 mb-8">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Create a market
            </h1>
            <p className="text-sm text-muted mt-2 max-w-2xl leading-relaxed">
              Define a binary question, pick a topic, and set when betting
              closes. After close,{" "}
              <span className="text-dim">you resolve YES or NO</span> as the
              market creator — settlement is not automatic.
            </p>
          </div>

          {isSuccess ? (
            <div className="rounded-2xl border border-yes/40 bg-yes-bg/40 p-8 text-center max-w-xl mx-auto">
              <div className="text-xs font-medium text-yes mb-2">
                Market is live
              </div>
              <h2 className="text-xl font-semibold text-yes mb-2">
                Market created
              </h2>
              <p className="text-sm text-dim mb-4">
                Betting is live until {formatCloseLabel(endDate)}. When it ends,
                open the market and resolve the outcome.
              </p>
              {createdInvite ? (
                <div className="mb-6 rounded-xl border border-accent/30 bg-background/50 p-4 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <PrivateBadge />
                    <span className="text-xs text-muted">Share this invite</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono-nums text-sm tracking-wider text-accent">
                      {createdInvite}
                    </code>
                    <button
                      type="button"
                      onClick={() => void copyInvite()}
                      className="text-[11px] px-2.5 py-1.5 rounded-lg border border-border-strong text-dim hover:text-foreground transition-colors focus-ring"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {createdId ? (
                  <button
                    onClick={() => router.push(`/market/${createdId}`)}
                    className="px-6 py-3 rounded-lg bg-yes hover:bg-yes/90 text-white text-sm font-semibold transition-colors focus-ring"
                  >
                    Open market
                  </button>
                ) : null}
                <button
                  onClick={() => router.push(isPrivate ? "/?category=Private" : "/")}
                  className="px-6 py-3 rounded-lg border border-border-strong text-sm text-dim hover:text-foreground transition-colors focus-ring"
                >
                  View all markets
                </button>
                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setCreatedId(null);
                    setCreatedInvite(null);
                    setQuestion("");
                    setResolutionNotes("");
                    setWantsPrivate(false);
                  }}
                  className="px-6 py-3 rounded-lg border border-border-strong text-sm text-dim hover:text-foreground transition-colors focus-ring"
                >
                  Create another
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start">
              <div className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-7 grid gap-7">
                <div>
                  <div className="flex items-end justify-between gap-3 mb-2">
                    <label
                      htmlFor="question"
                      className="block text-[13px] font-medium text-foreground/80"
                    >
                      Question
                    </label>
                    <span className="font-mono-nums text-[10px] text-muted">
                      {charCount}/160
                    </span>
                  </div>
                  <textarea
                    id="question"
                    value={question}
                    maxLength={160}
                    rows={3}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Will XLM close above $1.00 by Dec 31, 2026?"
                    className={`${INPUT_CLASS} resize-none leading-relaxed`}
                  />
                  <ul className="mt-2 space-y-1 text-xs text-muted">
                    <li>• Must resolve to a clear YES or NO</li>
                    <li>• Name a source of truth when the answer is ambiguous</li>
                    <li>• Avoid opinions — prefer measurable outcomes</li>
                  </ul>
                </div>

                <div>
                  <div className="text-[13px] font-medium text-foreground/80 mb-2">
                    Category
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SELECTABLE_CATEGORIES.map((c) => {
                      const active = category === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCategory(c)}
                          aria-pressed={active}
                          className={`text-left rounded-xl border px-3 py-2.5 transition-colors focus-ring ${
                            active
                              ? "border-foreground/40 bg-white/5"
                              : "border-border-strong hover:border-muted"
                          }`}
                        >
                          <span
                            className={`inline-block text-xs px-1.5 py-0.5 rounded border mb-1.5 ${CATEGORY_STYLES[c]}`}
                          >
                            {c}
                          </span>
                          <div className="text-[11px] text-muted leading-snug">
                            {CATEGORY_HINTS[c]}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="endDate"
                    className="block text-[13px] font-medium text-foreground/80 mb-2"
                  >
                    Betting closes
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => applyPreset(p.hours)}
                        className="text-[11px] px-2.5 py-1.5 rounded-lg border border-border-strong text-dim hover:text-foreground hover:border-muted transition-colors focus-ring"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <input
                    id="endDate"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setValidationError("");
                    }}
                    className={`${INPUT_CLASS} font-mono-nums`}
                  />
                  <p className="text-xs text-muted mt-1.5">
                    After this time, betting stops and only you can resolve the
                    outcome.
                  </p>
                </div>

                <div className="rounded-xl border border-border-strong bg-background/60 px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-medium text-foreground/80">
                          Private market
                        </span>
                        {isPrivate ? <PrivateBadge /> : null}
                      </div>
                      <p className="text-xs text-muted leading-relaxed max-w-md">
                        Invite-only. Hidden from the public grid. Share a code
                        so friends or a syndicate can join and bet.
                      </p>
                      {!isAdmin ? (
                        <p className="text-[11px] text-accent mt-2 leading-relaxed max-w-md">
                          Public markets are curated by the Nova team so every
                          question has a trusted resolution. You can create
                          private markets for your friends or community.
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isPrivate}
                      aria-disabled={!isAdmin}
                      disabled={!isAdmin}
                      onClick={() => setWantsPrivate((v) => !v)}
                      className={`relative shrink-0 h-7 w-12 rounded-full border transition-colors focus-ring disabled:cursor-not-allowed disabled:opacity-70 ${
                        isPrivate
                          ? "bg-accent border-accent"
                          : "bg-white/5 border-border-strong"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                          isPrivate ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="notes"
                    className="block text-[13px] font-medium text-foreground/80 mb-2"
                  >
                    Resolution criteria{" "}
                    <span className="text-muted font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="notes"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={2}
                    placeholder="e.g. Resolved using the daily close on CoinGecko at 00:00 UTC on the end date."
                    className={`${INPUT_CLASS} resize-none`}
                  />
                  <p className="text-xs text-muted mt-1.5">
                    For your notes only. Put critical
                    rules in the question itself.
                  </p>
                </div>

                <div className="rounded-xl border border-border-strong bg-background/60 px-4 py-3.5">
                  <div className="text-xs font-medium text-muted mb-2">
                    How it settles
                  </div>
                  <ol className="space-y-1.5 text-xs text-dim list-decimal list-inside">
                    <li>
                      Traders bet YES or NO with USDC while the market is open
                    </li>
                    <li>When the close time passes, betting locks</li>
                    <li>
                      You (the creator) resolve YES or NO from the market page
                    </li>
                    <li>
                      Winners claim their share of the losing pool minus a 2% fee
                    </li>
                  </ol>
                </div>

                {!isConnected ? (
                  <ConnectWallet />
                ) : (
                  <button
                    onClick={createMarket}
                    disabled={isPending || !canSubmit}
                    className="w-full py-3.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg text-[15px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
                  >
                    {isPending
                      ? "Creating market…"
                      : isPrivate
                        ? "Create private market"
                        : "Create market"}
                  </button>
                )}

                {validationError && (
                  <div className="text-xs text-no wrap-break-word" role="alert">
                    {validationError}
                  </div>
                )}
              </div>

              <aside className="lg:sticky lg:top-20 space-y-4">
                <div className="rounded-2xl border border-border-subtle bg-surface overflow-hidden">
                  <div className="px-5 pt-4 pb-3 border-b border-border-subtle">
                    <div className="text-xs font-medium text-muted">
                      Preview
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <MarketThumb
                        address={previewId}
                        question={question || "Preview market"}
                        category={category}
                        size={52}
                        rounded="rounded-xl"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <span
                            className={`inline-block text-xs px-1.5 py-0.5 rounded border ${CATEGORY_STYLES[category]}`}
                          >
                            {category}
                          </span>
                          {isPrivate ? <PrivateBadge /> : null}
                        </div>
                        <div className="text-sm leading-snug text-foreground/90">
                          {question.trim() || (
                            <span className="text-muted">
                              Your question appears here
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="rounded-lg bg-yes-bg border border-yes/20 px-3 py-2.5 text-center">
                        <div className="font-mono-nums text-lg text-yes">50%</div>
                        <div className="text-[10px] text-muted">Yes</div>
                      </div>
                      <div className="rounded-lg bg-no-bg border border-no/20 px-3 py-2.5 text-center">
                        <div className="font-mono-nums text-lg text-no">50%</div>
                        <div className="text-[10px] text-muted">No</div>
                      </div>
                    </div>

                    <dl className="space-y-2 text-xs">
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Closes</dt>
                        <dd className="text-dim text-right">
                          {formatCloseLabel(endDate)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Visibility</dt>
                        <dd className="text-dim">
                          {isPrivate ? "Private / invite" : "Public"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Resolver</dt>
                        <dd className="text-dim">You (creator)</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Funding</dt>
                        <dd className="font-mono-nums text-dim">
                          Roqqu · NGN / USDT / BTC
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <p className="text-[11px] text-muted leading-relaxed px-1">
                  Public markets are open to everyone. Private markets are
                  invite-only and unlock with a code you share. Stakes are in
                  USDC.
                </p>
              </aside>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
