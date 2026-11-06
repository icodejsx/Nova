# NOVA — Complete Context Document for AI Assistants

**Purpose:** Paste this entire document into ChatGPT (or any AI) so it fully understands what Nova is, what we built, what’s left, and how we talk about it for the Stellar Community Fund (SCF).

**Last updated:** 2026-09-24  
**Repo:** local workspace `/Users/user/Nova` (Nova Stellar prediction markets)  
**Audience:** AI helpers writing grant copy, product docs, pitches, or continuing engineering work

---

## How to use this with ChatGPT

Copy everything below the line into a new chat, then ask for what you need, e.g.:

- “Rewrite the SCF Interest Form Project Description”
- “Write a 60-second pitch”
- “Draft tranche milestones for Integration Track”
- “Explain Nova to a non-technical reviewer”

---

# PART 1 — ONE SENTENCE

**Nova** is a Stellar-native binary prediction market where people bet YES or NO with USDC, using Freighter, with a roadmap from public markets → private/invite-only markets → deeper privacy.

**Tagline:** *Trade the future. Keep what matters private.*

---

# PART 2 — ORIGIN STORY (BEGINNING)

### What came before: Hypa
- **Hypa** is our earlier product: binary prediction markets on **Avalanche Fuji** (EVM).
- Stack: Next.js, Solidity, MetaMask/wagmi, AVAX stakes.
- Live reference (may change): `https://hypa-9rp3.vercel.app`
- Repo reference: `https://github.com/icodejsx/Hypa_`
- Hypa proves the team can **ship a real markets product** (UI + create/bet/resolve/claim).

### Why Nova exists
- We are **re-platforming** that product onto **Stellar / Soroban** for the **Stellar Community Fund (SCF) Build Award**.
- Nova is a **new brand and new repo** — not called Hypa.
- In grant applications: cite Hypa as **prior traction**; Nova is the **Stellar project being funded**.

### Mapping Hypa → Nova

| Hypa (old) | Nova (new) |
|---|---|
| Avalanche Fuji | Stellar Testnet → Mainnet |
| Solidity | Soroban (Rust) |
| MetaMask / wagmi | Freighter + Stellar / Soroban SDK |
| AVAX stake | **USDC** (7 decimals) preferred |
| Brand: Hypa | Brand: **Nova** |

---

# PART 3 — PRODUCT (WHAT USERS DO)

### Core loop
1. **Authorized creators** create a binary YES/NO market with a close time.
2. Users **browse** markets (categories, featured, live odds).
3. Users **connect Freighter** and **bet** USDC on YES or NO while the market is open.
4. Odds = pool weights (YES pool vs NO pool).
5. After close, the **creator resolves** YES or NO (creator-oracle trust model — same as Hypa).
6. **Winners claim**; platform takes **2% fee**.

### Market types
- **Public markets** — anyone can see and bet (Phase A).
- **Private / invite-only markets** — hidden from public grid; unlock with invite code or allowlist (Phase B).

### What Nova is NOT (yet)
- Not a multi-outcome / sportsbook with dozens of legs.
- Not fully confidential / ZK privacy in v1.
- Not promising hidden bet amounts or confidential payouts as the Mainnet MVP deliverable (those are Phase C).

---

# PART 4 — STRATEGY: HYBRID PHASES (APPROVED)

**Why hybrid:** Highest SCF chance = shippable Mainnet MVP + a real Stellar privacy story, without blocking launch on research.

### Phase A — Mainnet MVP (MUST SHIP)
Public binary markets on Stellar:
- Create (whitelisted creators)
- Browse / filter
- Bet YES/NO with USDC
- Live odds + history charts
- Creator resolve + claim
- Freighter connect
- Hypa-parity dark UI (Nova branded; accent is Stellar gold / yellow on black in current UI)

**Status (2026-09-24):** UI + demo data + registry contract + tests mostly done. **Still needed:** Testnet deploy, wire live USDC transfers, live bet/resolve/claim via Freighter.

### Phase B — Privacy v1 (grant differentiator)
Private / invite-only markets:
- `is_private` flag
- Invite codes + allowlist
- UI: Private badge, Private tab, create toggle, invite gate on market page

**Status:** Implemented in contract + UI (demo unlock is client-side until Freighter wires `redeem_invite` on-chain).

### Phase C — Privacy v2+ (after Mainnet)
1. Hidden bet amounts (participation visible, size private)
2. Confidential payouts (align with Stellar confidential payments narrative)

**Rule for grants:** Mention B+C in vision; fund near-term deliverables as **A + B start**, not full crypto privacy in tranche 1.

---

# PART 5 — TECHNICAL ARCHITECTURE

### Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js App Router, Tailwind 4, Recharts |
| Wallet | Freighter (`@stellar/freighter-api`) |
| Chain | Stellar Testnet → Mainnet |
| Contracts | Soroban Rust — **Option B**: single `nova-registry` with market IDs |
| Stake | USDC (7 decimals) |

### Why Option B (single registry)
- One contract holds many markets by ID.
- Cheaper / simpler indexing than “one contract per market.”
- Events for trade history / odds charts.

### Contract capabilities (`contracts/nova-registry`)
- Admin initializes; **add/remove creators**
- `create_market` — public or private (+ invite code if private)
- `bet` — gated by allowlist if private
- `redeem_invite` / `add_allowlist` / `has_access`
- `resolve` / `claim` (2% fee)
- Events for history

**Note:** `bet` / `claim` currently record math + events; **USDC SAC token transfer still TODO** for real deploy.

### App routes
| Route | Purpose |
|---|---|
| `/` | Ticker, featured, overview, live pulse/news, category filters + **Private** tab, market grid |
| `/market/[id]` | Detail, odds chart, bet panel, resolve/claim; **InviteGate** if private & locked |
| `/create` | Creators only; optional **Private market** toggle + invite on success |
| `/api/history` | Odds history (demo cache → later indexer) |
| `/api/pulse` | Live news/pulse (RSS) |

### Demo mode
- If `NEXT_PUBLIC_CONTRACT_ID` is unset → **demo markets** (public + 3 private).
- Private demo invites e.g. `NOVA-TEAM01`, `NOVA-LAGOS99`, `NOVA-DISC7`.

### Design / brand (current UI)
- Black background (`#000`) + yellow accent (`#FDDA24`) — Stellar-gold feel, not Avalanche red.
- YES green / NO red for trading sides.
- Components: FeaturedMarket (ProbabilityOrbit), HomeOverview, LivePulse, MarketCards, etc.

---

# PART 6 — CURRENT BUILD STATUS (HONEST)

### Done
- [x] Next.js Nova app scaffold + branding
- [x] Hypa-parity UX flows (home, market, create)
- [x] Freighter connect stub
- [x] Demo markets + history API
- [x] Soroban registry + unit tests (incl. private market tests)
- [x] Phase B UI + contract ACL/invite model
- [x] README / handoff docs

### Not done yet (critical for SCF Mainnet story)
- [ ] Deploy `nova-registry` to Stellar Testnet
- [ ] Wire USDC SAC transfers in `bet` / `claim`
- [ ] Live Freighter transactions for create/bet/resolve/claim/redeem_invite
- [ ] Mainnet launch
- [ ] Audit (as needed for SCF / Audit Bank)

### Known limitations
- Creator-oracle trust (same as Hypa)
- Creation is whitelisted
- Contracts unaudited
- Demo private unlock is localStorage until on-chain redeem is wired

---

# PART 7 — SCF GRANT CONTEXT (WHAT WE’RE APPLYING FOR)

### Program
- **Stellar Community Fund (SCF) Build Award**
- Up to **~$150,000 in XLM**, milestone / tranche-based
- Typical timeline: **3–5 months** to Mainnet-ready product
- Handbook: https://stellar.gitbook.io/scf-handbook/scf-awards/build-award
- Site: https://communityfund.stellar.org (projects dashboard / awards)

### Process
1. **Interest form** (now) — describe project + preferred track + optional referrer code  
2. SCF reviews on a rolling basis (referrals help a lot)  
3. If eligible → **invited** to full Build submission for a round (e.g. SCF #46)  
4. Full form: technical roadmap, budget by tranche, traction, team  
5. If awarded → KYC/KYB before payment  

### Recommended track: **Integration**
Why:
- Prior traction (Hypa on another chain)
- Integrating Stellar building blocks: **Freighter, USDC, Soroban**

Alternative: **Open** (novel Stellar app + community vote) — usually weaker if Integration fits.

### What reviewers care about
1. Ecosystem value (real users / USDC / Freighter on Stellar)  
2. Technical feasibility (we already have UI + contracts)  
3. Roadmap clarity (Testnet → Mainnet in months, not years)  
4. Team capability (shipped Hypa)  
5. Honesty (don’t claim full confidential privacy as v1)

### Suggested ~4 month milestones (for full form later)

| Month | Milestone | Deliverable |
|---|---|---|
| 1 | Testnet MVP | Live Freighter + USDC bets on Testnet |
| 2 | Hardening | Seed markets, UX polish, docs, creator tools |
| 3 | Privacy v1 + audit prep | Private markets live; security review prep |
| 4 | Mainnet | Mainnet deploy, launch, SCF demo |

**Integration Track note:** final tranche may require a **committed onchain metric** (e.g. cumulative USDC volume), not Mainnet alone.

### Interest-form Project Description (approved draft)

Nova is a Stellar-native prediction market for binary (YES/NO) questions, settled in USDC.

Users connect with Freighter, browse live markets and odds, stake USDC on YES or NO, and claim payouts after the market creator resolves the outcome. Markets run on a Soroban registry contract (create → bet → resolve → claim).

We already shipped this product as Hypa on Avalanche. Nova is the Stellar rebuild: same clear trading UX, new chain, native USDC, and a privacy path that starts with invite-only / private markets (allowlist + invite codes)—not research-heavy crypto in v1.

What we’re asking SCF Build for: fund the last mile from working Testnet app → Mainnet launch in ~3–5 months (Freighter + live USDC markets), then expand private markets as Stellar’s differentiator.

Tagline: Trade the future. Keep what matters private.

---

# PART 8 — POSITIONING & COPY RULES

### Do say
- Stellar-native prediction markets  
- Prior traction via Hypa; Nova is the Stellar product  
- USDC + Freighter + Soroban  
- Private markets as Phase B differentiator  
- Clear path to Mainnet  

### Don’t say
- “We are Hypa on Stellar” as the brand  
- “Fully private / confidential / ZK from day one” as the funded MVP  
- Avalanche / AVAX / MetaMask as Nova’s stack  
- Guarantees of funding or exaggerated live Mainnet volume before it exists  

### Elevator pitches

**15 seconds:**  
Nova is prediction markets on Stellar — bet YES or NO in USDC with Freighter. We already shipped this on Avalanche as Hypa; now we’re launching on Stellar with private markets next.

**60 seconds:**  
Prediction markets are exploding, but Stellar still lacks a polished, consumer-grade binary markets app. Nova brings create / trade / resolve / claim in USDC on Soroban, with Freighter. Our team already proved the product as Hypa on Avalanche. SCF Build funds Testnet → Mainnet in a few months. After public markets, we ship invite-only private markets — groups trading without broadcasting everything to the public grid — and later explore deeper privacy aligned with Stellar.

---

# PART 9 — HOW SETTLEMENT WORKS (USER-FACING TRUTH)

1. Traders bet YES or NO with USDC while open.  
2. Close time hits → betting locks.  
3. Creator resolves YES or NO on-chain.  
4. Winners claim share of losing pool minus **2%** fee.  

Trust model: creator is the oracle (documented limitation; same as Hypa MVP).

---

# PART 10 — FILE MAP (FOR ENGINEERS)

```
Nova/
├── app/                    # Next.js UI
│   ├── page.tsx            # Home (featured, filters, Private tab)
│   ├── create/             # Create market (+ private toggle)
│   ├── market/[id]/       # Detail, BetPanel, ResolvePanel, InviteGate
│   ├── components/         # Cards, orbit, pulse, badges, wallet
│   ├── lib/                # types, access, demo-markets, odds
│   ├── hooks/              # useMarkets, etc.
│   └── api/                # history, pulse
├── contracts/nova-registry # Soroban registry (Phase A+B)
├── docs/                   # Handoff + plans + THIS document
└── README.md
```

Canonical product/tech handoff: `docs/NOVA_STELLAR_BUILD_HANDOFF.md`

---

# PART 11 — END STATE (WHAT “DONE” LOOKS LIKE FOR SCF)

**Success for funded Build Award:**
1. Nova live on **Stellar Mainnet**  
2. Real users trading **USDC** via **Freighter**  
3. Public markets working end-to-end  
4. Private/invite markets available as differentiator  
5. Demo video + writeup for SCF  
6. Clear next roadmap toward Phase C privacy (not required to claim final Mainnet tranche if Integration metric is met)

---

# PART 12 — INSTRUCTIONS TO THE AI READING THIS

When helping the Nova team:
1. Treat **Nova** as the product; **Hypa** as prior traction only.  
2. Prefer **Integration Track** framing unless asked otherwise.  
3. Keep Phase A shippable; don’t invent ZK/confidential claims as current deliverables.  
4. Be honest about Testnet deploy / USDC wiring still pending.  
5. Write clear, reviewer-friendly language — no buzzword soup.  
6. When drafting grant text, emphasize: shipped UX, Soroban registry, Freighter, USDC, Mainnet timeline, private markets as Stellar-native edge.

---

*End of Nova complete context document.*
