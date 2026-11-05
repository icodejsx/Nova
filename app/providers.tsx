"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  isConnected as freighterIsConnected,
  requestAccess,
  getAddress,
} from "@stellar/freighter-api";

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isPending: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState | null>(null);

export function Providers({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}

function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const connected = await freighterIsConnected();
        if (!connected.isConnected || cancelled) return;
        const { address: addr } = await getAddress();
        if (!cancelled && addr) setAddress(addr);
      } catch {
        // Freighter not installed — fine for demo browsing
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async () => {
    setIsPending(true);
    setError(null);
    try {
      const access = await requestAccess();
      if (access.error) {
        setError(
          typeof access.error === "string"
            ? access.error
            : access.error.message ?? "Freighter access denied"
        );
        return;
      }
      if (access.address) setAddress(access.address);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Install Freighter to connect on Stellar Testnet."
      );
    } finally {
      setIsPending(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      address,
      isConnected: !!address,
      isPending,
      error,
      connect,
      disconnect,
    }),
    [address, isPending, error, connect, disconnect]
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
