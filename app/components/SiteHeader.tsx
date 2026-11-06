"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useIsCreator } from "@/app/hooks/useIsCreator";
import { ConnectWallet } from "./ConnectWallet";
import { Logo } from "./Logo";

const navLink =
  "text-sm px-2.5 py-1.5 rounded-lg transition-colors focus-ring";

export function SiteHeader({ breadcrumb }: { breadcrumb?: ReactNode }) {
  const { isCreator } = useIsCreator();
  const pathname = usePathname();
  const onMarkets = pathname === "/" || pathname.startsWith("/market");

  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-background/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5 min-w-0">
          <Logo className="shrink-0" />

          {breadcrumb ?? (
            <nav className="hidden sm:flex items-center gap-1">
              <Link
                href="/"
                aria-current={onMarkets ? "page" : undefined}
                className={`${navLink} ${
                  onMarkets ? "text-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                Markets
              </Link>
              <Link
                href="/#news"
                className={`${navLink} text-muted hover:text-foreground`}
              >
                News
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isCreator && (
            <Link
              href="/create"
              className="text-sm px-3 py-1.5 rounded-lg text-muted hover:text-foreground transition-colors focus-ring"
            >
              Create
            </Link>
          )}
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}
