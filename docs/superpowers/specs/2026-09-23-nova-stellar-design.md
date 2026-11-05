# NOVA — Complete Build Handoff Spec

**Document purpose:** Single source of truth for starting an **entirely new GitHub repo** and building **Nova** from scratch in a new Cursor session.  
**Audience:** Another Cursor agent (or developer) with **no prior context**.  
**Date:** 2026-09-23  
**Status:** Approved product direction — ready to build Phase A (MVP).

---

## 0. Instructions for the receiving Cursor agent

You are building a **new project from scratch**. Do **not** assume this repo already exists.

1. Create a **new GitHub repository** named something like `nova-stellar` or `nova-markets`.
2. Treat this document as the **product + technical spec**. Follow it unless the user overrides.
3. **Clone the Hypa UI/UX exactly** (layout, components, dark theme, flows). Re-implement on **Stellar / Soroban**, not Avalanche/EVM.
4. Hypa (Avalanche) is **prior traction only** — different brand. Do **not** name the product Hypa.
5. Build in phases: **Phase A (MVP) first**. Privacy features are Phase B/C — design hooks, don’t block Mainnet MVP on them.
6. Prefer working software over perfect abstractions. Ship testnet → Mainnet path suitable for **Stellar Community Fund (SCF) Build Award**.

**Reference implementation (UI + product behavior to copy):**
- Repo: `https://github.com/icodejsx/Hypa_` (local workspace may be named Veilcast)
- Live app (Avalanche Fuji): `https://hypa-9rp3.vercel.app` (URL may change; use latest deploy)
- Stack today: Next.js App Router, Tailwind, wagmi/viem, Solidity on Avalanche Fuji

**You must re-platform:**
| Hypa (old) | Nova (new) |
|---|---|
| Avalanche Fuji C-Chain | Stellar (Testnet → Mainnet) |
| Solidity + Hardhat | Soroban (Rust) |
| wagmi + viem + MetaMask | Stellar wallets (Freighter, etc.) + Stellar SDK / Soroban RPC |
| AVAX as stake asset | Prefer **USDC** (and/or XLM) on Stellar |
| Brand: Hypa | Brand: **Nova** |

---

## 1. Product identity

### Brand
- **Name:** Nova  
- **Category:** Stellar-native binary prediction markets  
- **Positioning:** Prediction markets on Stellar — with a path to private participation  
- **Tagline (preferred):** *Trade the future. Keep what matters private.*  
- **Alternates:** *Stellar-native prediction markets.* / *Markets that settle fast. Privacy that scales later.*

### Relationship to Hypa
- Hypa = existing Avalanche Fuji MVP (proof the team can ship).
- Nova = **new brand**, new chain, new repo.
- In SCF applications: cite Hypa as prior work/traction; Nova is the funded Stellar project.

### Grant context (SCF Build)
- Target: [SCF Build Award](https://stellar.gitbook.io/scf-handbook/scf-awards/build-award) (up to ~$150k XLM, milestone-based, ~3–5 months to Mainnet).
- Preferred track: **Integration** (existing Hypa traction + Stellar building blocks) *or* **Open** if positioning as brand-new Stellar app with community vote.
- Reviewers care about: ecosystem value, technical feasibility, roadmap clarity, team capability, Mainnet ship.
- **Do not** promise all privacy crypto primitives in tranche 1.

---

## 2. Strategy: Hybrid (approved)

**Why hybrid:** Highest SCF chance — shippable Mainnet MVP + Stellar-native privacy story without blocking on confidential tech day one.

### Phase A — Mainnet MVP (MUST SHIP)
Public binary prediction markets on Stellar:
- Create market (authorized creators)
- Browse / filter markets
- Bet YES/NO with USDC (and/or XLM)
- Live odds from pool weights
- Price history charts from trade events
- Creator resolves after close
- Winners claim
- Freighter (or equivalent) wallet connect
- Dark UI **copied from Hypa**

### Phase B — Privacy v1 (grant differentiator)
**Private / invite-only markets** (groups, not fully public). Clearest UX, least research risk.

### Phase C — Privacy v2+ (roadmap after Mainnet)
1. Hidden bet amounts (participation visible, size private)  
2. Confidential payouts (align with Stellar confidential payments narrative)

**Rule:** Mention B+C in vision/docs; only A (+ maybe B start) as funded near-term deliverables.

---

## 3. Copy Hypa UI exactly — what to replicate

### Design tokens (from Hypa `globals.css`)
Keep the same dark aesthetic unless branding needs a Nova accent later.

```
--background: #0a0a0a
--foreground: #ededed
--surface: #141414
--surface-hover: #1a1a1a
--border-subtle: #222222
--border-strong: #333333
Accent (Hypa used Avalanche red): #E84142  → for Nova you MAY keep red OR introduce a Nova accent, but keep YES/NO colors:
--yes: #1D9E75 / yes-bg rgba(29,158,117,0.12)
--no: #E24B4A / no-bg rgba(226,75,74,0.12)
--muted: #666666
--dim: #888888
```

Typography: clean sans (Geist or similar). Mono nums for odds/volume. Focus rings, shimmer skeletons, fade-in-up cards — same motion language as Hypa.

**Logo:** New Nova mark (do not reuse Hypa “H.”). Keep header/footer lockup pattern: mark + wordmark.

### App routes / pages (parity)
| Route | Purpose |
|---|---|
| `/` | Ticker, featured market, category filters, market card grid |
| `/market/[id]` | Detail: thumb, status, probability cards, odds chart, bet panel, resolve/claim, market info |
| `/create` | Authorized creators only — rich create form |

### Shared chrome
- **SiteHeader:** sticky, blur, logo, Markets nav, Create (if authorized), Connect wallet  
- **SiteFooter:** brand, Markets categories, Protocol/Resources links, Discord, disclaimer, chain id  
- **Ticker:** scrolling live stats / markets strip  
- **ConnectWallet:** Freighter (etc.) instead of MetaMask/WalletConnect  

### Homepage composition (copy structure)
1. Ticker  
2. Header  
3. Featured market (highest volume live): question, thumb, % chance, volume, YES/NO CTAs, area chart  
4. Sticky category filter pills: All + categories with counts + Resolved  
5. Grid of MarketCards (3-col desktop)  
6. Footer  

### MarketCard (copy)
- Top probability bar (YES width)  
- Category badge, status (live / closing soon / settled), time left  
- Thumbnail + question  
- Sparkline of yes % history  
- YES / NO % + buttons  
- Volume + creator short address  

### Market detail (copy)
- Breadcrumb via header  
- Thumb + category + question  
- Status strip: Live / Awaiting resolution / Resolved, countdown, volume, resolver  
- YES/NO probability cards + volume/liquidity  
- OddsChart (area, trades count, movement)  
- Sticky BetPanel (desktop rail): side toggle, amount, presets, payout preview, position  
- ResolvePanel: creator resolve YES/NO after end; users claim  
- Market information + “How settlement works” steps  
- Copy contract/address + explorer link (Stellar expert / stexp)  

### Create page (copy Hypa’s improved create UI)
- Gate: authorized creators only  
- Question textarea + tips + char limit  
- **Category picker** (selectable chips with hints)  
- Betting closes: presets 24h / 7d / 30d / 90d + datetime  
- Optional resolution criteria notes (off-chain / local only — or store in metadata if you add it)  
- Settlement explainer: creator resolves after close (not automatic)  
- Sticky live preview card  
- Success state with open market CTA  

### Categories (same set)
`Crypto | Finance | Sports | Politics | Technology | Pop Culture | Other`  
Selectable on create excludes Other or includes it — match Hypa (selectable without Other).  
Legacy/inference fallback if on-chain category missing.

### Market imagery
Hypa derives images from question keywords (crypto icons, flags, brand favicons). Port `marketImage` / `MarketThumb` logic or equivalent CDN heuristics.

---

## 4. Domain model & market mechanics (parity with Hypa)

### Binary pool market
- Each market: `question`, `category`, `end_time`, `resolved`, `outcome` (YES=true / NO=false)  
- Pools: `total_yes`, `total_no`  
- Per-user: `yes_bet`, `no_bet`, `claimed`  
- Odds: `yes_percent = total_yes / (total_yes + total_no)` (50% if empty)  
- Fee: **2%** on winning claim (same as Hypa unless changed deliberately)

### Payout math (keep identical)
```
userShare   = userStake / winningPool
grossPayout = userStake + (userShare × losingPool)
netPayout   = grossPayout × 0.98
```

### Lifecycle
1. Authorized creator creates market (question, category, end time)  
2. Anyone bets YES/NO before `end_time`  
3. After `end_time`, betting locked  
4. **Creator/owner resolves** YES or NO (manual — user decision for MVP)  
5. Winners claim; fee retained  

### Access control
- **Creator whitelist** (or admin + `can_create` mapping) — not fully permissionless create at MVP  
- Rationale (from Hypa): without trustless resolution, permissionless create enables creator rug via dishonest resolve  
- UI hides Create unless connected address is authorized  

### Resolution policy (locked for MVP)
- **Creator only** resolves (not auto majority, not anyone)  
- Privacy phases may later change trust model; don’t redesign MVP around oracles unless Phase B needs it  

---

## 5. Stellar / Soroban architecture

### High-level
```
Nova Frontend (Next.js)
  ├── Stellar wallet (Freighter)
  ├── Soroban RPC reads/writes
  └── /api/history  → indexer for trade events / odds series

Soroban contracts
  ├── MarketFactory  → create + list markets, creator ACL
  └── PredictionMarket (or one contract with market IDs)
        → bet, resolve, claim, views
```

### Contract design choice (pick one and stick to it)
**Option A (closer to Hypa):** Factory deploys one contract instance per market.  
**Option B (often better on Soroban):** Single registry + market IDs in one contract (cheaper, simpler indexing).  

For Nova MVP, **Option B is recommended** unless you specifically want 1:1 Hypa deploy pattern for narrative. Document the choice in README.

### Assets
- Primary stake: **USDC** on Stellar (SAC / issued asset)  
- Optional: XLM  
- Handle trustlines / contract token interfaces correctly  

### Events / history
- Emit trade events (or durable ledger entries) sufficient to rebuild odds history  
- Server-side `/api/history`: cache + incremental index (Hypa learned: don’t N+1 RPC from every card)  
- Stale-while-revalidate; never block UI 10–20s on cold chart load  

### Wallets & network
- Stellar Testnet for development  
- Mainnet for SCF final tranche  
- Freighter browser extension; document mobile later if needed  

### Explorer links
- Use current Stellar explorers (stellarexpert / stexp equivalent) for accounts & contracts  

---

## 6. Frontend stack (new repo)

Suggested:
- **Next.js** (App Router) + TypeScript + Tailwind CSS 4  
- Stellar: `@stellar/stellar-sdk`, Freighter API / `@creit.tech/stellar-wallets-kit` (or current best practice)  
- Charts: Recharts (same as Hypa)  
- No wagmi/viem  

### Suggested folder map (mirror Hypa)
```
apps/web or /
  app/
    page.tsx                 # home
    create/page.tsx
    market/[id]/page.tsx
    api/history/route.ts
    components/              # SiteHeader, Footer, MarketCard, Featured, Ticker, Logo, ...
    hooks/                   # useMarkets, useMarketHistory, useIsCreator, ...
    lib/                     # odds, category, marketImage
    config/                  # network, contract IDs, token addresses
contracts/                   # Soroban Rust workspace
docs/                        # this spec + SCF notes
```

---

## 7. Feature checklist — Phase A (build this)

### Must have
- [ ] Deploy factory/registry + market logic on Stellar Testnet  
- [ ] Creator whitelist: admin can add creators  
- [ ] Create market with question, category, end time  
- [ ] List all markets; show category (on-chain or typed metadata)  
- [ ] Homepage: ticker, featured, filters, cards, sparklines  
- [ ] Detail: chart, bet YES/NO, payout preview, resolve, claim  
- [ ] History API with cache (sub-second warm loads)  
- [ ] Freighter connect/disconnect  
- [ ] Nova branding (logo placeholder OK at first)  
- [ ] Footer with Discord placeholder + Stellar links  
- [ ] Seed script: 10–20 demo markets  
- [ ] README: run locally, testnet faucet, Freighter setup  

### Explicitly out of Phase A
- Private markets  
- Hidden amounts  
- Confidential payouts  
- Multi-outcome markets  
- Order book / AMM beyond pool odds  
- Mobile-native wallet deep links (nice-to-have)  

### Phase B checklist (after A works)
- [ ] Invite-only / private market flag  
- [ ] Access list or invite codes  
- [ ] UI: Private badge; hide from public grid or separate tab  

### Phase C checklist
- [ ] Research Stellar confidential payments / privacy primitives available at build time  
- [ ] Hidden stake sizes  
- [ ] Confidential claim/payout path  

---

## 8. SCF-oriented roadmap (suggested ~4 months)

| Month | Milestone | Deliverable |
|---|---|---|
| 1 | Testnet MVP | Contracts + UI parity with Hypa on Stellar Testnet; Freighter; USDC bets |
| 2 | Hardening | Indexer reliability, seed markets, UX polish, creator tools, docs |
| 3 | Privacy v1 start + audit prep | Private markets prototype; security review prep |
| 4 | Mainnet | Mainnet deploy, public launch, SCF demo video / writeup |

Budget narrative: development time, infra (RPC), audit bank if eligible, design/branding for Nova.

---

## 9. Copy / microcopy to keep
- “Betting closes” / “Awaiting resolution” / “Settled”  
- “chance yes · X volume”  
- “How settlement works” 4 steps (bet → lock → creator resolves → claim − 2% fee)  
- Create gate: “Creators only” / curated resolvable questions  
- Disclaimer: testnet / unaudited / not financial advice (adapt for Mainnet later)  

Replace Avalanche/Fuji/AVAX strings with Stellar/Testnet/USDC|XLM.

---

## 10. Security & product constraints
- Reentrancy / CEI equivalent in Soroban  
- One claim per user per market  
- Resolve only after end time; only creator  
- No permissionless create until resolution is trust-minimized  
- Don’t store secrets in client; RPC keys server-side for indexer  
- Document known limitation: creator-oracle trust (same honesty as Hypa MVP)  

---

## 11. Brand assets to create in new repo
- `Nova` wordmark + simple mark (star / N / nova burst) — not Hypa H-dot  
- Favicon / `app/icon`  
- Open Graph title: “Nova — Prediction Markets on Stellar”  
- Discord community link (reuse or new)  

---

## 12. First commands for the new Cursor session (suggested)

Tell the agent:

> Read `NOVA_STELLAR_BUILD_HANDOFF.md` fully. Scaffold a new Next.js + Soroban monorepo for **Nova**. Implement Phase A only: factory/registry, markets, Hypa-identical UI on Stellar Testnet with Freighter and USDC. Do not implement privacy yet beyond stubs/comments in the roadmap README.

Then:
1. Scaffold repo  
2. Soroban hello → factory/market contracts  
3. Port UI page-by-page from Hypa structure  
4. Wire wallet + bets  
5. History API  
6. Seed + README  

---

## 13. Decisions log (from product discussion)

| Decision | Choice |
|---|---|
| Chain | Stellar (Soroban) |
| Brand | Nova (new, not Hypa) |
| Grant target | SCF Build Award |
| Strategy | Hybrid: public MVP + privacy roadmap |
| Privacy order | Private markets → hidden amounts → confidential payouts |
| Resolution MVP | Creator-only (manual) |
| Create access | Whitelisted creators |
| UI | Copy Hypa dark prediction-market UI exactly |
| Stake asset | USDC preferred (XLM optional) |
| All privacy in v1? | No — phase it for SCF feasibility |

---

## 14. Success criteria (Phase A done)

- User opens Nova on Testnet, connects Freighter, browses markets that look like Hypa  
- User places YES/NO bet in USDC; odds and chart update  
- Creator resolves after end; winner claims net of 2%  
- Cold history load is acceptable; warm load feels instant  
- README enables another developer to run in <30 minutes  

---

## 15. Optional: what to open-source from Hypa

You may reference or visually mirror Hypa. Prefer **re-implementing** for Stellar rather than forking EVM code into the new repo (keeps Nova clean and grant-honest). If forking UI components, strip Avalanche/wagmi and rebrand fully to Nova.

---

*End of handoff. Build Phase A first. Nova ≠ Hypa. Stellar ≠ Avalanche. Privacy is the roadmap, not the blocker.*
