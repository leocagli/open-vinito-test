import { NextRequest, NextResponse } from 'next/server';
import { sep6Deposit, sep6Withdraw, getTransactionStatus, fetchAnchorInfo, ANCHORS } from '@/lib/anchor';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  const anchorId = req.nextUrl.searchParams.get('anchor') ?? 'etherfuse';
  const txId = req.nextUrl.searchParams.get('txId');
  const authToken = req.headers.get('authorization')?.replace('Bearer ', '') ?? '';

  if (action === 'info') {
    const { info, error } = await fetchAnchorInfo(anchorId);
    return NextResponse.json(error ? { error } : info);
  }

  if (action === 'status' && txId) {
    return NextResponse.json(await getTransactionStatus({ anchorId, txId, authToken }));
  }

  return NextResponse.json({ anchors: Object.keys(ANCHORS) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, anchorId = 'etherfuse', account, amount, dest, assetCode, type } = body;
  const authToken = req.headers.get('authorization')?.replace('Bearer ', '') ?? body.authToken ?? '';

  if (action === 'deposit') {
    return NextResponse.json(await sep6Deposit({ anchorId, account, amount, authToken, assetCode }));
  }
  if (action === 'withdraw') {
    return NextResponse.json(await sep6Withdraw({ anchorId, account, amount, dest, authToken, assetCode, type }));
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
