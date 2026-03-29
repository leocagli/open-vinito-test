// Reflector Oracle — real-time price feeds for Vendimia World
// Uses Reflector Protocol on Stellar for on-chain price data
// Falls back to mock prices when oracle unavailable

import type { OraclePrice } from './vendimia-types';

// Reflector oracle contract on Stellar testnet
const REFLECTOR_RPC =
  process.env.REFLECTOR_RPC_URL || 'https://soroban-testnet.stellar.org';
const REFLECTOR_CONTRACT =
  process.env.REFLECTOR_CONTRACT_ID ||
  'CCYOZJCOPG34LLQQ7N24YXBM776TKDLTS5VLJEMTYXDB5XFB6FDTXL7';

// Price cache (30-second TTL)
const priceCache = new Map<string, { price: OraclePrice; expiresAt: number }>();
const CACHE_TTL = 30_000;

// Asset symbol → Reflector asset enum
const REFLECTOR_ASSETS: Record<string, number> = {
  XLM:  0,
  BTC:  1,
  ETH:  2,
  USDT: 3,
  BNB:  4,
  USDC: 5,
  TRX:  8,
  EURC: 15,
};

// Mock prices for game assets not on Reflector
const MOCK_PRICES: Record<string, number> = {
  WINE:  12.5,   // $ per bottle
  GRAPE: 0.8,    // $ per kg
  MALBEC: 15.0,
  BLEND:  10.0,
};

async function fetchReflectorPrice(symbol: string): Promise<number | null> {
  const assetId = REFLECTOR_ASSETS[symbol];
  if (assetId === undefined) return null;

  try {
    // Call Reflector contract via Soroban RPC (lastprice method)
    const res = await fetch(REFLECTOR_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'simulateTransaction',
        params: {
          transaction: buildReflectorCallXDR(REFLECTOR_CONTRACT, 'lastprice', assetId),
        },
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    // Parse the returned i128 price (7 decimal places)
    const result = json?.result?.results?.[0]?.xdr;
    if (!result) return null;
    // Decode price from XDR (simplified — returns raw integer / 1e7)
    const raw = decodeReflectorXDR(result);
    if (raw === null) return null;
    return raw / 1e7;
  } catch {
    return null;
  }
}

function buildReflectorCallXDR(_contractId: string, _method: string, _assetId: number): string {
  // Simplified stub — in production build a proper InvokeContractOp XDR
  // Returning empty string triggers the fallback to mock prices
  return '';
}

function decodeReflectorXDR(_xdr: string): number | null {
  // Simplified stub for XDR decoding
  return null;
}

export async function getPrice(symbol: string): Promise<OraclePrice> {
  const upper = symbol.toUpperCase();

  // Check cache
  const cached = priceCache.get(upper);
  if (cached && cached.expiresAt > Date.now()) return cached.price;

  // Try Reflector on-chain
  const reflectorPrice = await fetchReflectorPrice(upper);
  if (reflectorPrice !== null) {
    const price: OraclePrice = {
      asset: upper,
      priceUsd: reflectorPrice,
      source: 'reflector',
      timestamp: Date.now(),
    };
    priceCache.set(upper, { price, expiresAt: Date.now() + CACHE_TTL });
    return price;
  }

  // Fall back to mock
  const mockPrice = MOCK_PRICES[upper] ?? 1.0;
  const price: OraclePrice = {
    asset: upper,
    priceUsd: mockPrice,
    source: 'mock',
    timestamp: Date.now(),
  };
  priceCache.set(upper, { price, expiresAt: Date.now() + CACHE_TTL });
  return price;
}

export async function getPrices(symbols: string[]): Promise<OraclePrice[]> {
  return Promise.all(symbols.map(getPrice));
}

// Game-specific price helpers
export async function getWinePrice(): Promise<OraclePrice> {
  return getPrice('WINE');
}

export async function getGrapePrice(): Promise<OraclePrice> {
  return getPrice('GRAPE');
}

export async function getUsdcPrice(): Promise<OraclePrice> {
  return getPrice('USDC');
}
