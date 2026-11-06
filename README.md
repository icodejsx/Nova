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

## Roqqu integration (hackathon)

Nova uses the [Roqqu RAS API](https://roqqu-api-services.gitbook.io/ras) as its fiat/crypto on-ramp. All calls are server-side (`app/api/roqqu/*`, `app/lib/roqqu/server.ts`); the secret key never reaches the browser.

| Feature | Roqqu endpoints | Where |
|---|---|---|
| Fund Nova balance (NGN / USD) | `POST /payment-links` + encrypted payment-link webhooks (`aes-256-ctr`) | `/fund`, `/api/roqqu/fund`, `/api/roqqu/webhook` |
| Live prices + NGN rates | `GET /tokens`, `GET /rates` | market page chip, `/api/roqqu/prices` |
| Treasury balances + history | `POST /balances`, `POST /history` | `/fund` sidebar, `/api/roqqu/wallet` |
| Cash out winnings in USDT (TRC20 / BEP20) | `POST /wallets/send`, `GET /transaction/refId/:refid`, fee quote | `/fund` cash-out card, `/api/roqqu/send` |

**Simulation mode (default for the hackathon):** with `ROQQU_MODE=mock` (or no key) every flow runs against a server-side simulation that uses Roqqu's documented request/response shapes: a simulated hosted checkout at `/fund/checkout/[ref]` (deposit addresses + "I've sent the payment" → same code path as the `payment_link_completed` webhook), simulated prices/NGN rate, treasury wallet, and queued → on-chain-confirmed cash outs. Everything is labelled "simulated" in the UI.

**Accounts & sign-in:** users sign in with their Roqqu email and a one-time code (`/signin`). The server keeps their wallet ID, balance and activity (`app/lib/auth/*`, `.data/accounts.json`), credits deposits when Roqqu's webhook confirms them, and debits bets and cash outs, so users return to the same account on any device. In sandbox mode the code is shown on screen; set `RESEND_API_KEY` + `AUTH_FROM_EMAIL` for real email, and `AUTH_SECRET` in production. The JSON file store is for a single server; use a database before real money moves.

**Going live:** remove `ROQQU_MODE=mock`, set `ROQQU_API_KEY` (and `ROQQU_ENV=staging|live`) in `.env.local`, set `NEXT_PUBLIC_APP_URL` to your https origin, and register `/api/roqqu/webhook` in the Roqqu console. Roqqu doesn't support Stellar assets, so it funds a Nova balance; the Roqqu → Stellar USDC treasury bridge is post-hackathon work.

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
