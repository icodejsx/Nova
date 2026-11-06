"use client";

import { useAccount } from "@/app/hooks/useCredit";

/**
 * Creation policy:
 *  - any signed-in user can create private, invite-only markets (isCreator)
 *  - only Nova admins can create public markets (isAdmin)
 * Admins are set server-side with NOVA_ADMIN_EMAILS.
 */
export function useIsCreator() {
  const { signedIn, isAdmin } = useAccount();
  return { isCreator: signedIn, isAdmin: signedIn && isAdmin };
}
