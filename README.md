# Nova — Stellar-native binary prediction markets

**Tagline:** *Trade the future. Keep what matters private.*

Phase A: public binary markets on **Stellar Testnet** with Freighter + USDC.  
Phase B (this repo): **private / invite-only markets** — allowlist + invite codes, Private badge/tab, gated market UI.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without `NEXT_PUBLIC_CONTRACT_ID`, the app serves **demo markets** (including 3 private ones) so you can browse immediately.

### Try a private market

1. Home → **Private** tab  
2. Open a market → enter demo invite (shown on the unlock gate), e.g. `NOVA-TEAM01`  
3. Or create with **Private market** toggled on `/create`

### Freighter

1. Install [Freighter](https://www.freighter.app)
2. Switch network to **Testnet**
3. Fund via [Friendbot](https://friendbot.stellar.org)
4. Click **Connect** in Nova

### Demo seed

```bash
npm run seed
```

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js App Router, Tailwind 4, Recharts |
| Wallet | Freighter (`@stellar/freighter-api`) |
| Chain | Stellar Testnet → Mainnet |
| Contracts | Soroban Rust — **Option B** single registry (`contracts/nova-registry`) |
| Stake | USDC (7 decimals) |

## Architecture

```
Nova Frontend
  ├── Freighter
  ├── Soroban RPC (after deploy)
  └── /api/history  → odds series (demo cache → event indexer)

nova-registry
  ├── creator ACL
  ├── create_market (public | private + invite)
  ├── redeem_invite / add_allowlist / has_access
  ├── bet / resolve / claim
  └── trade events for history
```

See `docs/NOVA_STELLAR_BUILD_HANDOFF.md` and `docs/superpowers/plans/2026-09-23-nova-phase-a-scaffold.md`.

## Contracts

```bash
cd contracts
cargo test -p nova-registry
# deploy: see contracts/README.md
```

Set in `.env.local` after deploy:

```
NEXT_PUBLIC_CONTRACT_ID=C...
NEXT_PUBLIC_USDC_CONTRACT_ID=C...
```

## Phase checklist

### Phase A
- [x] Next.js scaffold + Nova branding
- [x] Hypa-parity UI (home, detail, create)
- [x] Freighter connect stub
- [x] History API (demo cache)
- [x] Registry contract + unit tests
- [ ] Deploy registry + USDC wiring on Testnet
- [ ] Live bet/resolve/claim via Freighter

### Phase B (privacy v1)
- [x] Invite-only / private market flag
- [x] Access list + invite codes (contract + demo client unlock)
- [x] UI: Private badge, Private tab, create toggle, market gate

### Phase C (roadmap)
- Hidden bet amounts
- Confidential payouts

## Known limitations

- Creator-oracle trust (same honesty model as the Avalanche MVP)
- Create is whitelisted until resolution is trust-minimized
- Contracts unaudited; Testnet only until SCF Mainnet tranche
- Demo invite unlock is client-side until Freighter wires `redeem_invite`

## License

MIT (planned)
