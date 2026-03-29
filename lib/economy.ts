// Vendimia Economy Orchestrator
// Ties together wallets, MPP, Oracle, DEX, Blend, DeFindex
// Called by the game loop when NPCs complete tasks

import { provisionNpcWallet, refreshNpcBalance } from './npc-wallets';
import { mppCharge } from './mpp';
import { getWinePrice, getGrapePrice } from './oracle';
import { getDexQuote } from './soroswap';
import { blendDeposit, accrueBlendYield } from './blend';
import { defindexDeposit, getTreasuryState } from './defindex';
import type { Agent, AgentWallet } from './vendimia-types';

// Task reward config — how much USDC each task earns on completion
const TASK_REWARDS: Record<string, number> = {
  cosecha:       2.5,
  poda:          1.5,
  riego:         1.0,
  embotellado:   3.0,
  fermentacion:  2.0,
  cata:          2.0,
  venta:         5.0,
  administracion: 1.5,
  contabilidad:  1.5,
  marketing:     2.0,
  descanso:      0.1,
  espera:        0.0,
};

// % of earnings auto-deposited to Blend
const BLEND_AUTO_INVEST_RATE = 0.3;
// % auto-deposited to DeFindex treasury
const DEFINDEX_TREASURY_RATE = 0.1;

// ─── Called when an NPC completes a task ─────────────────────────────────
export async function onTaskComplete(agent: Agent): Promise<{
  reward: number;
  txHash?: string;
  blendDeposited?: string;
  message: string;
}> {
  const rewardUsd = TASK_REWARDS[agent.task] ?? 0;
  if (rewardUsd === 0) return { reward: 0, message: 'No reward for this task' };

  const rewardStr = rewardUsd.toFixed(7);

  // Blend auto-invest
  const blendAmount = (rewardUsd * BLEND_AUTO_INVEST_RATE).toFixed(7);
  if (parseFloat(blendAmount) > 0 && agent.wallet?.funded) {
    await blendDeposit({ npcId: agent.id, amount: blendAmount }).catch(() => null);
  }

  // DeFindex treasury
  const treasuryAmount = (rewardUsd * DEFINDEX_TREASURY_RATE).toFixed(7);
  if (parseFloat(treasuryAmount) > 0) {
    await defindexDeposit({ npcId: agent.id, amount: treasuryAmount }).catch(() => null);
  }

  return {
    reward: rewardUsd,
    blendDeposited: blendAmount,
    message: `${agent.name} earned $${rewardStr} USDC completing ${agent.task}`,
  };
}

// ─── Provision wallets for all NPCs ───────────────────────────────────────
export async function initializeEconomy(agents: Agent[]): Promise<Record<string, AgentWallet>> {
  const wallets: Record<string, AgentWallet> = {};

  for (const agent of agents) {
    try {
      wallets[agent.id] = await provisionNpcWallet(agent.id);
    } catch {
      wallets[agent.id] = {
        publicKey: '',
        xlmBalance: '0',
        usdcBalance: '0',
        funded: false,
        network: 'testnet',
      };
    }
  }

  return wallets;
}

// ─── Periodic economy tick (call every ~10 seconds) ───────────────────────
export async function economyTick(agents: Agent[]): Promise<{
  prices: { wine: number; grape: number };
  treasury: ReturnType<typeof getTreasuryState>;
}> {
  // Accrue Blend yield
  accrueBlendYield();

  // Fetch current prices
  const [winePrice, grapePrice] = await Promise.all([
    getWinePrice(),
    getGrapePrice(),
  ]);

  return {
    prices: {
      wine: winePrice.priceUsd,
      grape: grapePrice.priceUsd,
    },
    treasury: getTreasuryState(),
  };
}

// ─── NPC payment on task delegation ──────────────────────────────────────
export async function npcPayForService(params: {
  fromNpcId: string;
  toNpcId: string;
  serviceType: string;
  agentWallets: Record<string, AgentWallet>;
}): Promise<{ ok: boolean; txHash?: string; error?: string }> {
  const { fromNpcId, toNpcId, serviceType, agentWallets } = params;
  const toWallet = agentWallets[toNpcId];
  if (!toWallet?.funded) return { ok: false, error: 'Recipient wallet not funded' };

  const amount = (TASK_REWARDS[serviceType] ?? 1.0).toFixed(7);

  return mppCharge({
    fromNpcId,
    toPublicKey: toWallet.publicKey,
    amount,
    currency: 'USDC',
    memo: `npc:${serviceType}:${toNpcId}`,
  });
}
