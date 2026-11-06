"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/app/components/SiteHeader";
import { applyAccount } from "@/app/lib/account-client";

const INPUT =
  "w-full bg-background border border-border-strong rounded-lg px-3.5 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-muted transition-colors";

/** Only allow same-site redirects. */
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/fund";
}

function SignInForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sandboxNote, setSandboxNote] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function requestCode() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await res.json()) as {
        error?: string;
        sandbox?: boolean;
        devCode?: string;
      };
      if (!res.ok) {
        setError(json.error ?? "Could not send a code.");
        return;
      }
      setSandboxNote(Boolean(json.sandbox));
      setCode(json.devCode ?? "");
      setStep("code");
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "That code didn't work.");
        return;
      }
      applyAccount(json);
      router.replace(next);
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
        Sign in to Nova
      </h1>
      <p className="text-sm text-muted mt-2 leading-relaxed">
        Use the email you use with Roqqu. New here? We&apos;ll create your Roqqu
        wallet in seconds. Your balance and activity are saved to your account.
      </p>

      <div className="mt-8 rounded-2xl border border-border-subtle bg-surface p-6 grid gap-4">
        {step === "email" ? (
          <>
            <div>
              <label
                htmlFor="signin-email"
                className="block text-[13px] font-medium text-foreground/80 mb-2"
              >
                Email
              </label>
              <input
                id="signin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && emailOk && !busy) void requestCode();
                }}
                placeholder="you@example.com"
                className={INPUT}
              />
            </div>
            <button
              type="button"
              onClick={() => void requestCode()}
              disabled={!emailOk || busy}
              className="w-full py-3.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg text-[15px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
            >
              {busy ? "Sending code…" : "Send me a code"}
            </button>
          </>
        ) : (
          <>
            <div>
              <label
                htmlFor="signin-code"
                className="block text-[13px] font-medium text-foreground/80 mb-2"
              >
                6-digit code
              </label>
              <input
                id="signin-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && code.length === 6 && !busy) void verifyCode();
                }}
                placeholder="123456"
                className={`${INPUT} font-mono-nums tracking-[0.4em] text-center text-lg`}
              />
              <p className="text-[11px] text-muted mt-2">
                We sent a code to <span className="text-foreground">{email}</span>.
              </p>
              {sandboxNote ? (
                <p className="text-[11px] text-accent mt-2 leading-relaxed">
                  Sandbox mode: email delivery is off, so your code is filled in
                  for you.
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void verifyCode()}
              disabled={code.length !== 6 || busy}
              className="w-full py-3.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg text-[15px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
            >
              {busy ? "Checking…" : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError("");
              }}
              className="text-xs text-muted hover:text-foreground transition-colors rounded focus-ring"
            >
              Use a different email
            </button>
          </>
        )}

        {error ? (
          <div className="text-xs text-no" role="alert">
            {error}
          </div>
        ) : null}
      </div>

      <Link
        href="/"
        className="mt-6 inline-block text-[13px] text-muted hover:text-dim transition-colors rounded focus-ring"
      >
        ← Back to markets
      </Link>
    </div>
  );
}

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Suspense fallback={<div className="max-w-md mx-auto px-6 py-16" />}>
        <SignInForm />
      </Suspense>
    </main>
  );
}
