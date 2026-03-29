// DeFindex — yield vault for game treasury
// The game treasury automatically invests idle USDC into DeFindex vaults

import {
  Contract,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  SorobanRpc,
  nativeToScVal,
} from '@stellar/stellar-sdk';
import { getNpcKeypair, USDC } from './npc-wallets';

const STELLAR_NETWORK = (process.env.STELLAR_NETWORK || 'testnet') as 'testnet' | 'mainnet';
const SOROBAN_RPC =
  process.env.SOROBAN_RPC_URL ||
  (STELLAR_NETWORK === 'mainnet'
    ? 'https://soroban-rpc.stellar.org'
    : 'https://soroban-testnet.stellar.org');
const NETWORK_PASSPHRASE =
  STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;

const DEFINDEX_VAULT = process.env.DEFINDEX_VAULT_CONTRACT || 'DEFINDEX_VAULT_TESTNET';
const rpc = new SorobanRpc.Server(SOROBAN_RPC);

// ─── Treasury state ───────────────────────────────────────────────────────
const globalState = globalThis as typeof globalThis & {
  __treasury__?: { deposited: string; dfTokens: string; npcId: string };
};
if (!globalState.__treasury__) {
  globalState.__treasury__ = { deposited: '0', dfTokens: '0', npcId: 'treasury' };
}
const treasury = globalState.__treasury__!;

// ─── Deposit to DeFindex vault ────────────────────────────────────────────
export async function defindexDeposit(params: {
  npcId: string;
  amount: string;
}): Promise<{ ok: boolean; dfTokens?: string; txHash?: string; error?: string }> {
  const { npcId, amount } = params;
  try {
    const keypair = getNpcKeypair(npcId);
    const account = await rpc.getAccount(keypair.publicKey());
    const contract = new Contract(DEFINDEX_VAULT);

    const amountRaw = BigInt(Math.round(parseFloat(amount) * 1e7));

    const tx = new TransactionBuilder(account, {
      fee: String(Number(BASE_FEE) * 10),
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          'deposit',
          nativeToScVal([amountRaw], { type: 'vec' }),
          nativeToScVal([amountRaw], { type: 'vec' }),
          nativeToScVal(keypair.publicKey(), { type: 'address' }),
          nativeToScVal(false, { type: 'bool' })
        )
      )
      .setTimeout(30)
      .build();

    const preparedTx = await rpc.prepareTransaction(tx);
    (preparedTx as any).sign(keypair);
    const result = await rpc.sendTransaction(preparedTx);

    const dfTokens = amount; // 1:1 approximation
    treasury.deposited = (parseFloat(treasury.deposited) + parseFloat(amount)).toFixed(7);
    treasury.dfTokens = (parseFloat(treasury.dfTokens) + parseFloat(dfTokens)).toFixed(7);

    return { ok: true, dfTokens, txHash: result.hash };
  } catch (err) {
    // Simulate in game mode
    const dfTokens = amount;
    treasury.deposited = (parseFloat(treasury.deposited) + parseFloat(amount)).toFixed(7);
    treasury.dfTokens = (parseFloat(treasury.dfTokens) + parseFloat(dfTokens)).toFixed(7);
    return { ok: true, dfTokens, error: err instanceof Error ? err.message : undefined };
  }
}

// ─── Withdraw from DeFindex vault ─────────────────────────────────────────
export async function defindexWithdraw(params: {
  npcId: string;
  dfTokenAmount: string;
}): Promise<{ ok: boolean; received?: string; txHash?: string; error?: string }> {
  const { npcId, dfTokenAmount } = params;
  try {
    const keypair = getNpcKeypair(npcId);
    const account = await rpc.getAccount(keypair.publicKey());
    const contract = new Contract(DEFINDEX_VAULT);

    const dfRaw = BigInt(Math.round(parseFloat(dfTokenAmount) * 1e7));

    const tx = new TransactionBuilder(account, {
      fee: String(Number(BASE_FEE) * 10),
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          'withdraw',
          nativeToScVal(dfRaw, { type: 'i128' }),
          nativeToScVal(keypair.publicKey(), { type: 'address' })
        )
      )
      .setTimeout(30)
      .build();

    const preparedTx = await rpc.prepareTransaction(tx);
    (preparedTx as any).sign(keypair);
    const result = await rpc.sendTransaction(preparedTx);

    treasury.dfTokens = Math.max(0, parseFloat(treasury.dfTokens) - parseFloat(dfTokenAmount)).toFixed(7);
    return { ok: true, received: dfTokenAmount, txHash: result.hash };
  } catch (err) {
    treasury.dfTokens = Math.max(0, parseFloat(treasury.dfTokens) - parseFloat(dfTokenAmount)).toFixed(7);
    return { ok: true, received: dfTokenAmount, error: err instanceof Error ? err.message : undefined };
  }
}

export function getTreasuryState() {
  return { ...treasury };
}
