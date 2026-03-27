# Open Vinito - Vendimia Multi-Chain

Aplicacion Next.js con experiencia tipo juego para interaccion on-chain en multiples redes.

Track principal del repo:

- BNB Chain (EVM): contratos y pagos x402.
- Stellar Testnet (Soroban + operaciones nativas).
- Hedera Testnet (pagos HBAR para agentes).

## Estado actual

- UI principal activa con panel de transacciones multi-red.
- Integracion wallet para BNB y Stellar.
- Endpoint Hedera para pagos de agentes listo en backend.
- Scripts de deploy para EVM y Soroban incluidos.

## Stack tecnico

- Next.js + React + TypeScript
- Wagmi + WalletConnect (BNB)
- Freighter / Stellar SDK (Stellar)
- Hedera SDK (HBAR payments)

## Requisitos

- Node.js 20+
- pnpm
- WalletConnect Project ID
- Freighter (si vas a probar Stellar desde browser)
- Variables Hedera para pagos HBAR (si vas a usar ese endpoint)

## Setup rapido

1. Instalar dependencias

```bash
pnpm install
```

2. Crear variables locales

```bash
cp .env.local.example .env.local
```

3. Agregar al menos:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=tu_project_id
```

Si vas a probar Hedera tambien agrega:

```env
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=tu_private_key
```

4. Levantar app

```bash
pnpm dev
```

## Scripts utiles

- `pnpm dev`: entorno local
- `pnpm hedera:setup`: valida configuracion de Hedera
- `pnpm deploy:evm:guide`: guia para deploy EVM
- `pnpm deploy:soroban:guide`: guia para deploy Soroban

## Redes y explorers

### BNB

- Testnet RPC: https://data-seed-prebsc-1-b.binance.org:8545
- Testnet explorer: https://testnet.bscscan.com
- Mainnet explorer: https://bscscan.com

### Stellar

- Horizon testnet: https://horizon-testnet.stellar.org
- Soroban RPC testnet: https://soroban-testnet.stellar.org
- Explorer testnet: https://stellar.expert/explorer/testnet

### Hedera

- Explorer testnet: https://hashscan.io/testnet

## Pruebas de transacciones por red

Esta seccion consolida la evidencia que ya teniamos en el track multi-red.

### 1) BNB (EVM)

- Contrato X402ServicePaywall (mainnet):
  - `0xb1684c357fe1b5b13de671303ccf6243b0c588e9`
  - Explorer: https://bscscan.com/address/0xb1684c357fe1b5b13de671303ccf6243b0c588e9

- Prueba settle402 (tx hash):
  - `0xaa1ef7d4c3b58ac42e08de07a37f8878a79f35dfa8347979c0175f4c6c52ecec`
  - Explorer: https://bscscan.com/tx/0xaa1ef7d4c3b58ac42e08de07a37f8878a79f35dfa8347979c0175f4c6c52ecec

### 2) Stellar (Soroban Testnet)

- Escrow contract ID (testnet):
  - `CDPVYRH3OR35NV3Y6GMVEOI2L66FDVLK6HE3T2TIN5PJ7LXXBIKOKXCO`
  - Explorer: https://stellar.expert/explorer/testnet/contract/CDPVYRH3OR35NV3Y6GMVEOI2L66FDVLK6HE3T2TIN5PJ7LXXBIKOKXCO

- Flujo de prueba soportado por app/scripts:
  - Construccion de transaccion (build tx)
  - Firma y envio
  - Verificacion por hash en Stellar Expert

### 3) Hedera (HBAR Agent Payment)

- Endpoint operativo:
  - `GET /api/hedera/agent-payment` (health/config)
  - `POST /api/hedera/agent-payment` (ejecuta transfer HBAR)

- Evidencia funcional implementada:
  - Devuelve `transactionId`, `receiptStatus` y `explorerUrl`
  - URL de verificacion en HashScan se construye automaticamente

Ejemplo de respuesta esperada:

```json
{
  "success": true,
  "transactionId": "0.0.xxxxx@1234567890.123456789",
  "receiptStatus": "SUCCESS",
  "network": "testnet",
  "explorerUrl": "https://hashscan.io/testnet/transaction/0.0.xxxxx@1234567890.123456789"
}
```

## Arquitectura resumida

- `app/`: paginas y APIs (incluye rutas Stellar y Hedera)
- `components/`: UI del juego, wallet y paneles de transaccion
- `lib/`: configuraciones y utilidades por red
- `scripts/deploy/`: scripts de despliegue EVM y Soroban

## Notas importantes

- No commitear secretos en `.env.local`.
- Mantener testnet para desarrollo cuando aplique.
- Si quieres correr demo full multi-red, valida fondos/faucets en BNB testnet y Stellar testnet.
