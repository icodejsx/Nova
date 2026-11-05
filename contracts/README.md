# Nova contracts

**Design:** Option B — single `nova-registry` Soroban contract with market IDs (cheaper indexing than one contract per market).

## Prerequisites

```bash
# Install Stellar CLI (includes Soroban)
curl -s https://raw.githubusercontent.com/stellar/stellar-cli/main/install.sh | bash
# or: cargo install --locked stellar-cli --features opt
```

## Build & test

```bash
cd contracts
cargo test -p nova-registry
stellar contract build --manifest-path nova-registry/Cargo.toml
```

## Deploy (Testnet)

```bash
stellar keys generate nova-admin --network testnet --fund
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/nova_registry.wasm \
  --source nova-admin \
  --network testnet

# Then initialize with admin + USDC SAC address, add creators, set NEXT_PUBLIC_CONTRACT_ID
```

## Token transfers

`bet` / `claim` currently record pool math and emit events. Wire USDC SAC `transfer` in the deploy iteration before Mainnet.

## Phase B (private markets)

`create_market` takes `is_private` + `invite_code`. Private markets gate `bet` via allowlist:

- `redeem_invite(user, market_id, code)` — join allowlist
- `add_allowlist(creator, market_id, user)` — creator grants access
- `has_access(market_id, user)` — view helper
