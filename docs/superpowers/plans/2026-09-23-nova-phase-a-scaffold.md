# Nova Phase A Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or subagent-driven-development) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a Nova monorepo (Next.js + Soroban) with Hypa-parity UI on Stellar Testnet stubs, ready to wire Freighter + USDC bets.

**Architecture:** Option B — single Soroban registry contract holding market IDs + pool state. Next.js App Router UI mirrors Hypa layout/tokens; Freighter + `@stellar/stellar-sdk` replace wagmi. Demo seed markets power the UI until contracts are deployed.

**Tech Stack:** Next.js 15+ (App Router), TypeScript, Tailwind CSS 4, Recharts, `@stellar/stellar-sdk`, Freighter API, Soroban Rust (`soroban-sdk`)

## Global Constraints

- Brand: **Nova** (never Hypa in product copy)
- Chain: Stellar Testnet → Mainnet; stake asset: **USDC** (XLM optional later)
- UI: copy Hypa dark prediction-market UX exactly; YES/NO colors unchanged
- Contract design: **Option B** single registry + market IDs
- Resolution: creator-only after `end_time`; create: whitelisted creators
- Fee: 2% on winning claim; payout math identical to Hypa
- Phase A only — privacy B/C are README roadmap stubs only
- No wagmi/viem/MetaMask

---

### Task 1: Repo scaffold + docs

**Files:**
- Create: `package.json`, `README.md`, `.gitignore`, `.env.example`
- Create: `docs/NOVA_STELLAR_BUILD_HANDOFF.md` (copied)
- Create: `docs/superpowers/plans/2026-09-23-nova-phase-a-scaffold.md`

- [ ] **Step 1:** Initialize Next.js App Router + Tailwind at repo root
- [ ] **Step 2:** Add Stellar deps (`@stellar/stellar-sdk`, `@stellar/freighter-api`, `recharts`)
- [ ] **Step 3:** Copy handoff + write README with run/Freighter/faucet instructions
- [ ] **Step 4:** Verify `npm run build` succeeds with stub pages

---

### Task 2: Soroban registry contract (Option B)

**Files:**
- Create: `contracts/Cargo.toml` (workspace)
- Create: `contracts/nova-registry/Cargo.toml`
- Create: `contracts/nova-registry/src/lib.rs`
- Create: `contracts/nova-registry/src/test.rs`

**Interfaces (contract):**
- `initialize(admin, token)`
- `add_creator(address)` / `remove_creator` / `is_creator`
- `create_market(question, category, end_time) -> u32`
- `bet(market_id, is_yes, amount)`
- `resolve(market_id, outcome)`
- `claim(market_id)`
- Views: `get_market`, `get_position`, `market_count`, `list_markets`

- [ ] **Step 1:** Scaffold Rust workspace + contract stub with types matching domain model
- [ ] **Step 2:** Implement create/bet/resolve/claim + 2% fee + creator ACL
- [ ] **Step 3:** Unit tests for odds empty=50%, payout math, resolve-after-end, one claim
- [ ] **Step 4:** Document deploy commands in `contracts/README.md` (stellar CLI)

---

### Task 3: Port Hypa UI → Nova (demo data)

**Files:**
- Create: `app/**` pages/components/hooks/lib/config mirroring Hypa
- Create: `app/lib/demo-markets.ts` seed data
- Create: SVG Nova mark (no Hypa H-dot)

- [ ] **Step 1:** Port `globals.css` tokens; rename `--avax` → `--accent` (keep red or Nova accent)
- [ ] **Step 2:** Port chrome: Logo, SiteHeader, SiteFooter, Ticker, ConnectWallet (Freighter stub)
- [ ] **Step 3:** Port home: FeaturedMarket, MarketCard, filters, skeletons
- [ ] **Step 4:** Port `/market/[id]` + BetPanel/ResolvePanel/OddsChart stubs
- [ ] **Step 5:** Port `/create` gated by `useIsCreator`
- [ ] **Step 6:** Wire hooks to demo markets when `NEXT_PUBLIC_CONTRACT_ID` unset

---

### Task 4: History API + seed + polish

**Files:**
- Create: `app/api/history/route.ts` (in-memory/disk cache stub)
- Create: `scripts/seed-demo-markets.ts`
- Create: `.env.example`

- [ ] **Step 1:** History API returns demo odds series; SWR-friendly cache headers
- [ ] **Step 2:** Seed script documents 10–20 demo questions
- [ ] **Step 3:** README Phase B/C stubs; success criteria checklist
- [ ] **Step 4:** `npm run build` + `npm run dev` smoke check

---

## Self-review

1. **Spec coverage:** Phase A must-haves mapped to Tasks 1–4; privacy deferred to README only.
2. **Placeholders:** Contract deploy IDs live in env; Freighter wires in Task 3 ConnectWallet.
3. **Types:** `MarketData.id: string` (u32 as string) replaces EVM `address`.
