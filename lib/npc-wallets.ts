// NPC Wallet Management — Stellar Sponsored Agent Accounts
// Each NPC gets a deterministic keypair derived from the game seed + NPC id
// Wallets are provisioned via Stellar's sponsorship protocol (no XLM required)

import { Keypair, Horizon, Asset, Networks } from '@stellar/stellar-sdk';
import type { AgentWallet } from './vendimia-types';

const GAME_SEED = process.env.GAME_WALLET_SEED || 'vendimia-world-npc-seed-v1';
const STELLAR_NETWORK = (process.env.STELLAR_NETWORK || 'testnet') as 'testnet' | 'mainnet';
const HORIZON_URL =
  STELLAR_NETWORK === 'mainnet'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org';
const SPONSORED_SERVICE =
  process.env.SPONSORED_ACCOUNT_SERVICE ||
  'https://stellar-sponsored-agent-account.onrender.com';

// USDC contract on testnet / mainnet
const USDC_ISSUER_TESTNET = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const USDC_ISSUER_MAINNET = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
const USDC_ISSUER =
  STELLAR_NETWORK === 'mainnet' ? USDC_ISSUER_MAINNET : USDC_ISSUER_TESTNET;
export const USDC = new Asset('USDC', USDC_ISSUER);

const server = new Horizon.Server(HORIZON_URL);

// ─── Keypair derivation ────────────────────────────────────────────────────
// Each NPC gets a deterministic keypair so wallets survive restarts
function deriveNpcKeypair(npcId: string): Keypair {
  // Use a simple HKDF-like derivation: hash(seed + npcId)
  const crypto = require('crypto');
  const seed = crypto
    .createHash('sha256')
    .update(`${GAME_SEED}:npc:${npcId}`)
    .digest();
  return Keypair.fromRawEd25519Seed(seed);
}

// ─── In-memory keypair registry ───────────────────────────────────────────
const globalState = globalThis as typeof globalThis & {
  __npcKeypairs__?: Map<string, Keypair>;
};
const npcKeypairs: Map<string, Keypair> =
  globalState.__npcKeypairs__ ?? new Map();
if (!globalState.__npcKeypairs__) globalState.__npcKeypairs__ = npcKeypairs;

export function getNpcKeypair(npcId: string): Keypair {
  if (!npcKeypairs.has(npcId)) {
    npcKeypairs.set(npcId, deriveNpcKeypair(npcId));
  }
  return npcKeypairs.get(npcId)!;
}

export function getNpcPublicKey(npcId: string): string {
  return getNpcKeypair(npcId).publicKey();
}

// ─── Sponsored account provisioning ──────────────────────────────────────
async function provisionViaSponsoredService(keypair: Keypair): Promise<boolean> {
  try {
    // Step 1: request unsigned sponsorship tx
    const createRes = await fetch(`${SPONSORED_SERVICE}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicKey: keypair.publicKey() }),
    });
    if (!createRes.ok) return false;
    const { unsignedXDR } = await createRes.json();

    // Step 2: sign with NPC keypair
    const { TransactionBuilder, Networks: StellarNetworks } = await import('@stellar/stellar-sdk');
    const network =
      STELLAR_NETWORK === 'mainnet'
        ? StellarNetworks.PUBLIC
        : StellarNetworks.TESTNET;
    const tx = TransactionBuilder.fromXDR(unsignedXDR, network);
    tx.sign(keypair);

    // Step 3: submit for co-signing
    const submitRes = await fetch(`${SPONSORED_SERVICE}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signedXDR: tx.toXDR() }),
    });
    return submitRes.ok;
  } catch {
    return false;
  }
}

// Fallback: Friendbot on testnet
async function provisionViaFriendbot(publicKey: string): Promise<boolean> {
  if (STELLAR_NETWORK !== 'testnet') return false;
  try {
    const res = await fetch(
      `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
    );
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Main provisioning function ───────────────────────────────────────────
export async function provisionNpcWallet(npcId: string): Promise<AgentWallet> {
  const keypair = getNpcKeypair(npcId);
  const publicKey = keypair.publicKey();

  // Check if account already exists
  try {
    const account = await server.loadAccount(publicKey);
    const xlm = account.balances.find((b: any) => b.asset_type === 'native');
    const usdc = account.balances.find(
      (b: any) => b.asset_code === 'USDC' && b.asset_issuer === USDC_ISSUER
    );
    return {
      publicKey,
      xlmBalance: xlm?.balance ?? '0',
      usdcBalance: usdc?.balance ?? '0',
      funded: true,
      network: STELLAR_NETWORK,
    };
  } catch {
    // Account doesn't exist — provision it
  }

  // Try sponsored service first, fall back to friendbot
  const ok =
    (await provisionViaSponsoredService(keypair)) ||
    (await provisionViaFriendbot(publicKey));

  if (ok) {
    // Give Horizon a moment to index
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const account = await server.loadAccount(publicKey);
      const xlm = account.balances.find((b: any) => b.asset_type === 'native');
      const usdc = account.balances.find(
        (b: any) => b.asset_code === 'USDC' && b.asset_issuer === USDC_ISSUER
      );
      return {
        publicKey,
        xlmBalance: xlm?.balance ?? '0',
        usdcBalance: usdc?.balance ?? '0',
        funded: true,
        network: STELLAR_NETWORK,
      };
    } catch {
      // Indexed but couldn't load — return partial
    }
  }

  return {
    publicKey,
    xlmBalance: '0',
    usdcBalance: '0',
    funded: false,
    network: STELLAR_NETWORK,
  };
}

// ─── Refresh wallet balance ────────────────────────────────────────────────
export async function refreshNpcBalance(npcId: string): Promise<AgentWallet> {
  const publicKey = getNpcPublicKey(npcId);
  try {
    const account = await server.loadAccount(publicKey);
    const xlm = account.balances.find((b: any) => b.asset_type === 'native');
    const usdc = account.balances.find(
      (b: any) => b.asset_code === 'USDC' && b.asset_issuer === USDC_ISSUER
    );
    return {
      publicKey,
      xlmBalance: xlm?.balance ?? '0',
      usdcBalance: usdc?.balance ?? '0',
      funded: true,
      network: STELLAR_NETWORK,
    };
  } catch {
    return {
      publicKey,
      xlmBalance: '0',
      usdcBalance: '0',
      funded: false,
      network: STELLAR_NETWORK,
    };
  }
}

// ─── Batch provision all NPCs ─────────────────────────────────────────────
export async function provisionAllNpcWallets(
  npcIds: string[]
): Promise<Record<string, AgentWallet>> {
  const results: Record<string, AgentWallet> = {};
  // Provision 3 at a time to avoid rate limits
  for (let i = 0; i < npcIds.length; i += 3) {
    const chunk = npcIds.slice(i, i + 3);
    const settled = await Promise.allSettled(
      chunk.map((id) => provisionNpcWallet(id))
    );
    chunk.forEach((id, idx) => {
      const res = settled[idx];
      results[id] =
        res.status === 'fulfilled'
          ? res.value
          : {
              publicKey: getNpcPublicKey(id),
              xlmBalance: '0',
              usdcBalance: '0',
              funded: false,
              network: STELLAR_NETWORK,
            };
    });
  }
  return results;
}
