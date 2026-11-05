import Link from "next/link";
import {
  CONTRACT_ID,
  DISCORD_URL,
  NETWORK,
  REPO_URL,
} from "@/app/config/network";
import { CATEGORIES } from "@/app/lib/category";
import { Logo } from "./Logo";

const PROTOCOL_LINKS = [
  {
    label: "Registry contract",
    href: CONTRACT_ID
      ? `${NETWORK.explorerBase}/contract/${CONTRACT_ID}`
      : `${REPO_URL}#contracts`,
  },
  { label: "Source code", href: REPO_URL },
  { label: "How settlement works", href: `${REPO_URL}#architecture` },
  { label: "Known limitations", href: `${REPO_URL}#known-limitations` },
  { label: "Roadmap", href: `${REPO_URL}#roadmap` },
];

const RESOURCE_LINKS = [
  { label: "Join the community", href: DISCORD_URL },
  { label: "Get testnet XLM", href: "https://friendbot.stellar.org" },
  { label: "Stellar Expert", href: NETWORK.explorerBase },
  { label: "Stellar docs", href: "https://developers.stellar.org" },
  {
    label: "Install Freighter",
    href: "https://www.freighter.app",
  },
];

const LEGAL_LINKS = [
  { label: "Discord", href: DISCORD_URL },
  { label: "Source", href: REPO_URL },
  {
    label: "Contract",
    href: CONTRACT_ID
      ? `${NETWORK.explorerBase}/contract/${CONTRACT_ID}`
      : REPO_URL,
  },
  { label: "Faucet", href: "https://friendbot.stellar.org" },
];

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-xs text-muted hover:text-foreground transition-colors rounded focus-ring"
    >
      {label}
    </a>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border-subtle bg-surface/30">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <Logo markHeight={34} />

            <p className="mt-3 text-xs leading-relaxed text-muted max-w-xs">
              Trade the future. Keep what matters private. Prediction markets
              natively on Stellar.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border-strong px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-yes" />
              <span className="font-mono-nums text-[10px] uppercase tracking-wide text-dim">
                Stellar testnet
              </span>
            </div>
          </div>

          <nav aria-labelledby="footer-markets">
            <h2
              id="footer-markets"
              className="text-[11px] font-semibold uppercase tracking-wide text-dim mb-3"
            >
              Markets
            </h2>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-xs text-muted hover:text-foreground transition-colors rounded focus-ring"
                >
                  All markets
                </Link>
              </li>
              {CATEGORIES.filter((category) => category !== "Other").map(
                (category) => (
                  <li key={category}>
                    <Link
                      href={`/?category=${encodeURIComponent(category)}`}
                      className="text-xs text-muted hover:text-foreground transition-colors rounded focus-ring"
                    >
                      {category}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </nav>

          <nav aria-labelledby="footer-protocol">
            <h2
              id="footer-protocol"
              className="text-[11px] font-semibold uppercase tracking-wide text-dim mb-3"
            >
              Protocol
            </h2>
            <ul className="space-y-2">
              {PROTOCOL_LINKS.map((link) => (
                <li key={link.label}>
                  <ExternalLink {...link} />
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-resources">
            <h2
              id="footer-resources"
              className="text-[11px] font-semibold uppercase tracking-wide text-dim mb-3"
            >
              Resources
            </h2>
            <ul className="space-y-2">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.label}>
                  <ExternalLink {...link} />
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-border-subtle">
          <p className="text-[11px] leading-relaxed text-muted max-w-3xl">
            Nova runs on the Stellar Testnet. Markets trade in test USDC with no
            monetary value, contracts are unaudited, and outcomes are resolved by
            the market creator. Nothing here is financial advice. Privacy
            features (invite-only markets, hidden amounts, confidential payouts)
            are on the roadmap — not in Phase A.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            <span className="font-mono-nums text-[11px] text-muted">
              © {year} Nova
            </span>
            {LEGAL_LINKS.map((link) => (
              <ExternalLink key={link.label} {...link} />
            ))}
            <span className="sm:ml-auto font-mono-nums text-[10px] uppercase tracking-wide text-muted">
              Testnet
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
