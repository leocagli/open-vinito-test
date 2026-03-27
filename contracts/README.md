# Contracts

This repository includes 2 contracts per network.

---

## Deployed Addresses

### BNB Smart Chain Mainnet (chainId 56)

| Contract | Address | Explorer |
|---|---|---|
| X402ServicePaywall | `0xb1684c357fe1b5b13de671303ccf6243b0c588e9` | https://bscscan.com/address/0xb1684c357fe1b5b13de671303ccf6243b0c588e9 |

Proof of contract interaction:

- deploy tx hash: `0x6679180202cb302e89818eed654b966860e5bc9f876aa4346878441d71a02037`
- `settle402` tx hash: `0xaa1ef7d4c3b58ac42e08de07a37f8878a79f35dfa8347979c0175f4c6c52ecec`
- payment ref: `open-vinito-mainnet-proof-20260327`
- payment ref hash: `0x45e6e386943ca6138820f3434640fedb33846bf24d58c3caff7a18854d892f50`
- on-chain verification: `hasPaid(...) == true`

### BNB Smart Chain Testnet (chainId 97)

| Contract | Address | Explorer |
|---|---|---|
| EscrowMilestone | `PENDING_DEPLOY` | — |
| X402ServicePaywall | `PENDING_DEPLOY` | — |

### Stellar Testnet (Soroban)

| Contract | Contract ID | Explorer |
|---|---|---|
| stellar-escrow | `CDPVYRH3OR35NV3Y6GMVEOI2L66FDVLK6HE3T2TIN5PJ7LXXBIKOKXCO` | https://stellar.expert/explorer/testnet/contract/CDPVYRH3OR35NV3Y6GMVEOI2L66FDVLK6HE3T2TIN5PJ7LXXBIKOKXCO |
| stellar-reputation | `PENDING_DEPLOY` | — |

Proof of deployment:

- WASM upload tx hash: `27b2828cb5dfb17671ce7f88eb18fbbeea846c3e2e17fd5292af0ef0e7619c71`
- Contract create tx hash: `1ebe996a488554a823ef3d1c97b8599cd667a4282be6e990202e6dbaa5d0fc93`
- on-chain verification: contract code and instance confirmed on Soroban testnet

### Hedera Testnet

| Artifact | Value | Explorer |
|---|---|---|
| Operator account | `0.0.8400062` | https://hashscan.io/testnet/account/0.0.8400062 |
| Proof payment tx | `0.0.8400062@1774635529.516395639` | https://hashscan.io/testnet/transaction/0.0.8400062@1774635529.516395639 |
| Recipient account created during proof | `0.0.8401288` | https://hashscan.io/testnet/account/0.0.8401288 |

Proof of usage:

- payment status: `SUCCESS`
- memo: `agent:vendimia proof 1774635533524`
- on-chain verification: new Hedera account created and funded on testnet

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
# EVM (BNB Testnet)
$env:DEPLOYER_PRIVATE_KEY="0xyour_key"
$env:EVM_NETWORK="testnet"
node scripts/deploy/evm/deploy.mjs

# EVM (BNB Mainnet)
$env:DEPLOYER_PRIVATE_KEY="0xyour_key"
$env:EVM_NETWORK="mainnet"
$env:EVM_CONTRACTS="x402"
node scripts/deploy/evm/deploy.mjs

# EVM interaction proof (x402)
$env:DEPLOYER_PRIVATE_KEY="0xyour_key"
$env:EVM_NETWORK="mainnet"
$env:X402_CONTRACT="0xb1684c357fe1b5b13de671303ccf6243b0c588e9"
node scripts/deploy/evm/interact.mjs

# Stellar Testnet — fondeo automático vía Friendbot
node scripts/deploy/soroban/deploy.mjs
```
