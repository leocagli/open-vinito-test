// Machine Payments Protocol (MPP) — Stellar implementation
// Implements charge (one-time SAC transfer) and channel (off-chain commitments)
// Mirrors the @stellar/mpp API design for forward compatibility

import {
  Keypair,
  Horizon,
  TransactionBuilder,
  Operation,
  Asset,
  BASE_FEE,
  Networks,
} from '@stellar/stellar-sdk';
import { getNpcKeypair, USDC } from './npc-wallets';
import type { MppChannel } from './vendimia-types';

const STELLAR_NETWORK = (process.env.STELLAR_NETWORK || 'testnet') as 'testnet' | 'mainnet';
const HORIZON_URL =
  STELLAR_NETWORK === 'mainnet'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE =
  STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;

const server = new Horizon.Server(HORIZON_URL);

// ─── In-memory channel registry ──────────────────────────────────────────
const globalState = globalThis as typeof globalThis & {
  __mppChannels__?: Map<string, MppChannel>;
};
const channels: Map<string, MppChannel> =
  globalState.__mppChannels__ ?? new Map();
if (!globalState.__mppChannels__) globalState.__mppChannels__ = channels;

// ─── Charge Mode — Single SAC transfer ───────────────────────────────────
export interface MppChargeParams {
  fromNpcId: string;
  toPublicKey: string;
  amount: string;
  currency?: 'USDC' | 'XLM';
  memo?: string;
}

export interface MppChargeResult {
  ok: boolean;
  txHash?: string;
  error?: string;
}

export async function mppCharge(params: MppChargeParams): Promise<MppChargeResult> {
  const { fromNpcId, toPublicKey, amount, currency = 'USDC', memo } = params;
  try {
    const keypair = getNpcKeypair(fromNpcId);
    const account = await server.loadAccount(keypair.publicKey());
    const fee = await server.fetchBaseFee().catch(() => Number(BASE_FEE));
    const asset = currency === 'USDC' ? USDC : Asset.native();

    const txBuilder = new TransactionBuilder(account, {
      fee: String(fee * 2),
      networkPassphrase: NETWORK_PASSPHRASE,
    }).addOperation(
      Operation.payment({ destination: toPublicKey, asset, amount })
    );

    if (memo) txBuilder.addMemo({ type: 'text', value: memo } as any);

    const tx = txBuilder.setTimeout(30).build();
    tx.sign(keypair);

    const result = await server.submitTransaction(tx);
    return { ok: true, txHash: result.hash };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'MPP charge failed' };
  }
}

// ─── Channel Mode — Off-chain commitments ────────────────────────────────
export interface MppOpenChannelParams {
  fromNpcId: string;
  toPublicKey: string;
  initialBalance: string;
  currency?: 'USDC' | 'XLM';
}

export function mppOpenChannel(params: MppOpenChannelParams): MppChannel {
  const channelId = `ch_${params.fromNpcId}_${Date.now()}`;
  const channel: MppChannel = {
    channelId,
    from: getNpcKeypair(params.fromNpcId).publicKey(),
    to: params.toPublicKey,
    balance: params.initialBalance,
    currency: params.currency ?? 'USDC',
    status: 'open',
  };
  channels.set(channelId, channel);
  return channel;
}

export interface MppChannelPayParams {
  channelId: string;
  amount: string;
}

export function mppChannelPay(params: MppChannelPayParams): { ok: boolean; remaining: string; error?: string } {
  const channel = channels.get(params.channelId);
  if (!channel || channel.status !== 'open') {
    return { ok: false, remaining: '0', error: 'Channel not found or not open' };
  }
  const remaining = parseFloat(channel.balance) - parseFloat(params.amount);
  if (remaining < 0) {
    return { ok: false, remaining: channel.balance, error: 'Insufficient channel balance' };
  }
  channel.balance = remaining.toFixed(7);
  return { ok: true, remaining: channel.balance };
}

export async function mppCloseChannel(channelId: string): Promise<MppChargeResult> {
  const channel = channels.get(channelId);
  if (!channel) return { ok: false, error: 'Channel not found' };

  channel.status = 'closing';

  // Settle outstanding balance on-chain
  const npcId = Object.keys(Object.fromEntries(channels)).find(
    (k) => channels.get(k)?.channelId === channelId
  ) ?? channelId;

  const result = await mppCharge({
    fromNpcId: npcId.split('_')[1] ?? npcId,
    toPublicKey: channel.to,
    amount: channel.balance,
    currency: channel.currency,
    memo: `mpp:settle:${channelId}`,
  });

  if (result.ok) {
    channel.status = 'closed';
    channel.balance = '0';
  }
  return result;
}

export function getChannels(): MppChannel[] {
  return Array.from(channels.values());
}

export function getChannel(channelId: string): MppChannel | undefined {
  return channels.get(channelId);
}
