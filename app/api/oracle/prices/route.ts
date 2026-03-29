import { NextRequest, NextResponse } from 'next/server';
import { getPrices, getPrice } from '@/lib/oracle';

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol');
  const symbols = req.nextUrl.searchParams.get('symbols');

  if (symbol) {
    const price = await getPrice(symbol);
    return NextResponse.json(price);
  }

  const list = symbols ? symbols.split(',') : ['XLM', 'USDC', 'BTC', 'ETH', 'WINE', 'GRAPE'];
  const prices = await getPrices(list);
  return NextResponse.json({ prices });
}
