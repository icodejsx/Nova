/** Stellar Testnet config for Nova Phase A. */

export const NETWORK = {
  name: "Stellar Testnet",
  passphrase: "Test SDF Network ; September 2015",
  rpcUrl:
    process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ??
    "https://soroban-testnet.stellar.org",
  horizonUrl:
    process.env.NEXT_PUBLIC_HORIZON_URL ??
    "https://horizon-testnet.stellar.org",
  explorerBase:
    process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://stellar.expert/explorer/testnet",
} as const;

/** Set after deploy; empty → UI uses demo markets. */
export const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID ?? "";

/** Native SAC / USDC contract ID on Testnet (placeholder until wired). */
export const USDC_CONTRACT_ID = process.env.NEXT_PUBLIC_USDC_CONTRACT_ID ?? "";

/** USDC on Stellar typically uses 7 decimals. */
export const USDC_DECIMALS = 7;

export const FEE_BPS = 200; // 2%

export const USE_DEMO = !CONTRACT_ID;

export const DISCORD_URL =
  process.env.NEXT_PUBLIC_DISCORD_URL ?? "https://discord.gg/placeholder";

export const REPO_URL =
  process.env.NEXT_PUBLIC_REPO_URL ?? "https://github.com/nova-markets/nova";
