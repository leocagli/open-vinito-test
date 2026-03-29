import { NextRequest, NextResponse } from 'next/server';
import { sep24Deposit } from '@/lib/anchor';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { anchorId = 'etherfuse', account, amount, assetCode } = body;
  const authToken = req.headers.get('authorization')?.replace('Bearer ', '') ?? body.authToken ?? '';
  const result = await sep24Deposit({ anchorId, account, amount, authToken, assetCode });
  return NextResponse.json(result);
}
