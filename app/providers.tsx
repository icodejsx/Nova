"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useAccount } from "@/app/hooks/useCredit";
import { refreshAccount, signOut } from "@/app/lib/account-client";

/**
 * Nova's wallet is a Roqqu-backed account. Users sign in with their Roqqu
 * email (one-time code); the server keeps their wallet ID, balance and
 * activity, so they come back to the same account on any device.
 */
interface WalletState {
  /** Roqqu wallet ID (empty when signed out or still loading). */
  address: string;
  email: string;
  /** True when signed in. */
  isConnected: boolean;
  /** True until the first account check finishes. */
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const WalletContext = createContext<WalletState | null>(null);

export function Providers({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}

function WalletProvider({ children }: { children: ReactNode }) {
  const account = useAccount();

  useEffect(() => {
    void refreshAccount();
  }, []);

  const value = useMemo<WalletState>(
    () => ({
      address: account.walletId,
      email: account.email,
      isConnected: account.signedIn,
      isLoading: !account.loaded,
      signOut,
    }),
    [account.walletId, account.email, account.signedIn, account.loaded]
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
