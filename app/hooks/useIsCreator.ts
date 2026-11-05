"use client";

import { useWallet } from "@/app/providers";

/**
 * Creator whitelist. In demo mode, any connected Freighter address can create.
 * On-chain: call is_creator(address) on nova-registry.
 */
export function useIsCreator() {
  const { isConnected, address } = useWallet();
  const isCreator = isConnected && !!address;
  return { isCreator, isAdmin: isCreator };
}
