import Link from "next/link";
import { DISCORD_URL, REPO_URL } from "@/app/config/network";
import { Logo } from "./Logo";

const linkClass =
  "text-sm text-muted hover:text-foreground transition-colors rounded focus-ring";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border-subtle">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-xs">
            <Logo markHeight={26} />
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Prediction markets for Nigeria. Pay in naira, cash out in USDT.
              Payments by Roqqu.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-8 gap-y-3">
            <Link href="/" className={linkClass}>
              Markets
            </Link>
            <Link href="/fund" className={linkClass}>
              Wallet
            </Link>
            <Link href="/create" className={linkClass}>
              Create a market
            </Link>
            <a href={`${REPO_URL}#architecture`} target="_blank" rel="noreferrer" className={linkClass}>
              How it works
            </a>
            <a href={DISCORD_URL} target="_blank" rel="noreferrer" className={linkClass}>
              Community
            </a>
          </nav>
        </div>

        <p className="mt-8 pt-6 border-t border-border-subtle text-xs leading-relaxed text-muted max-w-3xl">
          © {year} Nova. Nova is in private beta. Payments run in Roqqu sandbox
          mode, so no real money moves yet, and outcomes are decided by the
          market creator. Nothing here is financial advice.
        </p>
      </div>
    </footer>
  );
}
