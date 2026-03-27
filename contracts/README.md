# Contracts

This repository includes 2 contracts per network.

---

## Deployed Addresses

### BNB Smart Chain Testnet (chainId 97)

| Contract | Address | Explorer |
|---|---|---|
| EscrowMilestone | `PENDING_DEPLOY` | — |
| X402ServicePaywall | `PENDING_DEPLOY` | — |

### Stellar Testnet (Soroban)

| Contract | Contract ID | Explorer |
|---|---|---|
| stellar-escrow | `PENDING_DEPLOY` | — |
| stellar-reputation | `PENDING_DEPLOY` | — |

---

## Source Code

### EVM (BNB Smart Chain)

- `contracts/evm/EscrowMilestone.sol`
  - Escrow por hitos para acuerdos payer-payee.
  - Funciones: `createDeal`, `release`, `refund`, `raiseDispute`
- `contracts/evm/X402ServicePaywall.sol`
  - Registro on-chain de pagos tipo x402 (payment required).
  - Funciones: `settle402`, `hasPaid`, `withdraw`

### Stellar Soroban

- `contracts/stellar/escrow/src/lib.rs`
  - Escrow base en Soroban (create/release/dispute/get).
- `contracts/stellar/reputation/src/lib.rs`
  - Reputacion on-chain para fallback de track 8004 (init/get/set_score/apply_delta).
- `contracts/stellar/REPUTATION_FALLBACK.md`
  - Fallback de track 8004 hacia reputacion.

---

## Deploy

```bash
# EVM (BNB Testnet) — necesita tBNB en: https://testnet.bnbchain.org/faucet-smart
$env:DEPLOYER_PRIVATE_KEY="0xyour_key"
node scripts/deploy/evm/deploy.mjs

# Stellar Testnet — fondeo automático vía Friendbot
node scripts/deploy/soroban/deploy.mjs
```
