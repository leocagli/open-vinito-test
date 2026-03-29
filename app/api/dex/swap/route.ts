import { NextRequest, NextResponse } from 'next/server';
import { getDexQuote, executeSwap } from '@/lib/soroswap';

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get('from') ?? 'XLM';
  const to = req.nextUrl.searchParams.get('to') ?? 'USDC';
  const amount = req.nextUrl.searchParams.get('amount') ?? '10';
  const quote = await getDexQuote({ fromAsset: from, toAsset: to, amount });
  return NextResponse.json(quote);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { npcId, fromAsset, toAsset, amount, minReceive } = body;
  if (!npcId || !fromAsset || !toAsset || !amount) {
    return NextResponse.json({ error: 'npcId, fromAsset, toAsset, amount required' }, { status: 400 });
  }
  const result = await executeSwap({ npcId, fromAsset, toAsset, amount, minReceive: minReceive ?? '0' });
  return NextResponse.json(result);
}
