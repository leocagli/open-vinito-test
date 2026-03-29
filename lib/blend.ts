// Blend Protocol — yield on NPC earnings
// NPCs deposit USDC into Blend pools and earn yield automatically
// Uses Blend's Soroban contracts on Stellar

import {
  Keypair,
  Contract,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  SorobanRpc,
  scValToNative,
  nativeToScVal,
} from '@stellar/stellar-sdk';
import { getNpcKeypair, USDC } from './npc-wallets';
import type { BlendPosition } from './vendimia-types';

const STELLAR_NETWORK = (process.env.STELLAR_NETWORK || 'testnet') as 'testnet' | 'mainnet';
const SOROBAN_RPC =
  process.env.SOROBAN_RPC_URL ||
  (STELLAR_NETWORK === 'mainnet'
    ? 'https://soroban-rpc.stellar.org'
    : 'https://soroban-testnet.stellar.org');
const NETWORK_PASSPHRASE =
  STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;

// Blend pool contract addresses
const BLEND_POOL_TESTNET = process.env.BLEND_POOL_CONTRACT || 'BLEND_POOL_TESTNET_CONTRACT';
const BLEND_POOL_MAINNET = process.env.BLEND_POOL_CONTRACT_MAINNET || '';
const BLEND_POOL = STELLAR_NETWORK === 'mainnet' ? BLEND_POOL_MAINNET : BLEND_POOL_TESTNET;

// In-memory position store
const globalState = globalThis as typeof globalThis & {
  __blendPositions__?: Map<string, BlendPosition>;
};
const positions: Map<string, BlendPosition> =
  globalState.__blendPositions__ ?? new Map();
if (!globalState.__blendPositions__) globalState.__blendPositions__ = positions;

const rpc = new SorobanRpc.Server(SOROBAN_RPC);

// ─── Deposit into Blend ───────────────────────────────────────────────────
export async function blendDeposit(params: {
  npcId: string;
  amount: string;
}): Promise<{ ok: boolean; txHash?: string; error?: string }> {
  const { npcId, amount } = params;
  try {
    const keypair = getNpcKeypair(npcId);
    const account = await rpc.getAccount(keypair.publicKey());
    const contract = new Contract(BLEND_POOL);

    const tx = new TransactionBuilder(account, {
      fee: String(Number(BASE_FEE) * 10),
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          'supply',
          nativeToScVal(keypair.publicKey(), { type: 'address' }),
          nativeToScVal(USDC.contractId(NETWORK_PASSPHRASE), { type: 'address' }),
          nativeToScVal(BigInt(Math.round(parseFloat(amount) * 1e7)), { type: 'i128' })
        )
      )
      .setTimeout(30)
      .build();

    const preparedTx = await rpc.prepareTransaction(tx);
    (preparedTx as any).sign(keypair);
    const result = await rpc.sendTransaction(preparedTx);

    // Track position locally
    const existing = positions.get(npcId);
    const newDeposited = (parseFloat(existing?.deposited ?? '0') + parseFloat(amount)).toFixed(7);
    positions.set(npcId, {
      publicKey: keypair.publicKey(),
      deposited: newDeposited,
      earned: existing?.earned ?? '0',
      apy: 4.5,
      poolId: BLEND_POOL,
    });

    return { ok: true, txHash: result.hash };
  } catch (err) {
    // Store simulated position even if on-chain fails (game mode)
    const keypair = getNpcKeypair(npcId);
    const existing = positions.get(npcId);
    const newDeposited = (parseFloat(existing?.deposited ?? '0') + parseFloat(amount)).toFixed(7);
    positions.set(npcId, {
      publicKey: keypair.publicKey(),
      deposited: newDeposited,
      earned: existing?.earned ?? '0',
      apy: 4.5,
      poolId: BLEND_POOL,
    });
    return { ok: true, error: err instanceof Error ? err.message : undefined };
  }
}

// ─── Withdraw from Blend ──────────────────────────────────────────────────
export async function blendWithdraw(params: {
  npcId: string;
  amount: string;
}): Promise<{ ok: boolean; txHash?: string; error?: string }> {
  const { npcId, amount } = params;
  const position = positions.get(npcId);
  if (!position) return { ok: false, error: 'No Blend position found' };

  try {
    const keypair = getNpcKeypair(npcId);
    const account = await rpc.getAccount(keypair.publicKey());
    const contract = new Contract(BLEND_POOL);

    const tx = new TransactionBuilder(account, {
      fee: String(Number(BASE_FEE) * 10),
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          'withdraw',
          nativeToScVal(keypair.publicKey(), { type: 'address' }),
          nativeToScVal(USDC.contractId(NETWORK_PASSPHRASE), { type: 'address' }),
          nativeToScVal(BigInt(Math.round(parseFloat(amount) * 1e7)), { type: 'i128' })
        )
      )
      .setTimeout(30)
      .build();

    const preparedTx = await rpc.prepareTransaction(tx);
    (preparedTx as any).sign(keypair);
    const result = await rpc.sendTransaction(preparedTx);

    const newDeposited = Math.max(0, parseFloat(position.deposited) - parseFloat(amount)).toFixed(7);
    position.deposited = newDeposited;

    return { ok: true, txHash: result.hash };
  } catch (err) {
    const newDeposited = Math.max(0, parseFloat(position.deposited) - parseFloat(amount)).toFixed(7);
    position.deposited = newDeposited;
    return { ok: true, error: err instanceof Error ? err.message : undefined };
  }
}

// ─── Simulate yield accrual (run periodically) ────────────────────────────
export function accrueBlendYield(): void {
  const APY = 0.045;
  const secondsPerYear = 365 * 24 * 3600;
  const tickSeconds = 10;
  const tickRate = (1 + APY) ** (tickSeconds / secondsPerYear) - 1;

  for (const [npcId, pos] of positions.entries()) {
    const earnedDelta = parseFloat(pos.deposited) * tickRate;
    pos.earned = (parseFloat(pos.earned) + earnedDelta).toFixed(7);
  }
}

export function getBlendPosition(npcId: string): BlendPosition | undefined {
  return positions.get(npcId);
}

export function getAllBlendPositions(): BlendPosition[] {
  return Array.from(positions.values());
}
