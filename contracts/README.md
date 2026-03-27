# Contracts

This repository includes 2 contracts per network.

## EVM

- contracts/evm/EscrowMilestone.sol
  - Escrow por hitos para acuerdos payer-payee.
- contracts/evm/X402ServicePaywall.sol
  - Registro on-chain de pagos tipo x402 (payment required).

## Stellar

- contracts/stellar/escrow/src/lib.rs
  - Escrow base en Soroban (create/release/dispute/get).
- contracts/stellar/reputation/src/lib.rs
  - Reputacion on-chain para fallback de track 8004 (init/get/set_score/apply_delta).
- contracts/stellar/REPUTATION_FALLBACK.md
  - Fallback de track 8004 hacia reputacion.
