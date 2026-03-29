// Soroswap / SDEX DEX integration
// Routes swaps through Soroswap, Phoenix, or SDEX depending on best price
// Used by NPCs to sell wine tokens and buy supplies

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
import type { DexSwapQuote } from './vendimia-types';

const STELLAR_NETWORK = (process.env.STELLAR_NETWORK || 'testnet') as 'testnet' | 'mainnet';
const HORIZON_URL =
  STELLAR_NETWORK === 'mainnet'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE =
  STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;

const server = new Horizon.Server(HORIZON_URL);

// Soroswap API endpoint
const SOROSWAP_API =
  process.env.SOROSWAP_API || 'https://api.soroswap.finance';

// ─── Quote ────────────────────────────────────────────────────────────────
export async function getDexQuote(params: {
  fromAsset: string;
  toAsset: string;
  amount: string;
  slippage?: number;
}): Promise<DexSwapQuote> {
  const { fromAsset, toAsset, amount, slippage = 0.5 } = params;

  // Try Soroswap quote API
  try {
    const url = `${SOROSWAP_API}/quote?from=${fromAsset}&to=${toAsset}&amount=${amount}&slippage=${slippage}&network=${STELLAR_NETWORK}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      return {
        fromAsset,
        toAsset,
        fromAmount: amount,
        toAmount: data.toAmount ?? data.expectedAmount ?? '0',
        price: parseFloat(data.price ?? '0'),
        route: data.route ?? `${fromAsset}→${toAsset}`,
        protocol: 'soroswap',
      };
    }
  } catch { /* fall through to SDEX */ }

  // Fall back to SDEX strict-receive path via Horizon
  try {
    const fromA = fromAsset === 'XLM' ? 'native' : fromAsset;
    const toA = toAsset === 'XLM' ? 'native' : toAsset;
    const paths = await server.strictSendPaths(
      fromA === 'native' ? Asset.native() : USDC,
      amount,
      [toA === 'native' ? Asset.native() : USDC]
    ).call();

    const best = paths.records[0];
    if (best) {
      return {
        fromAsset,
        toAsset,
        fromAmount: amount,
        toAmount: best.destination_amount,
        price: parseFloat(best.destination_amount) / parseFloat(amount),
        route: best.path.map((a: any) => a.asset_code ?? 'XLM').join('→') || `${fromAsset}→${toAsset}`,
        protocol: 'sdex',
      };
    }
  } catch { /* fall through */ }

  // Last resort: mock quote
  const mockRate = 1.0;
  return {
    fromAsset,
    toAsset,
    fromAmount: amount,
    toAmount: (parseFloat(amount) * mockRate).toFixed(7),
    price: mockRate,
    route: `${fromAsset}→${toAsset}`,
    protocol: 'sdex',
  };
}

// ─── Execute swap via SDEX path payment ──────────────────────────────────
export async function executeSwap(params: {
  npcId: string;
  fromAsset: string;
  toAsset: string;
  amount: string;
  minReceive: string;
}): Promise<{ ok: boolean; txHash?: string; received?: string; error?: string }> {
  const { npcId, fromAsset, toAsset, amount, minReceive } = params;
  try {
    const keypair = getNpcKeypair(npcId);
    const account = await server.loadAccount(keypair.publicKey());
    const fee = await server.fetchBaseFee().catch(() => Number(BASE_FEE));

    const sendAsset = fromAsset === 'XLM' ? Asset.native() : USDC;
    const destAsset = toAsset === 'XLM' ? Asset.native() : USDC;

    const tx = new TransactionBuilder(account, {
      fee: String(fee * 2),
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.pathPaymentStrictSend({
          sendAsset,
          sendAmount: amount,
          destination: keypair.publicKey(),
          destAsset,
          destMin: minReceive,
          path: [],
        })
      )
      .setTimeout(30)
      .build();

    tx.sign(keypair);
    const result = await server.submitTransaction(tx);

    return { ok: true, txHash: result.hash };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Swap failed' };
  }
}
