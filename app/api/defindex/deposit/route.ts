import { NextRequest, NextResponse } from 'next/server';
import { defindexDeposit, defindexWithdraw, getTreasuryState } from '@/lib/defindex';

export async function GET() {
  return NextResponse.json(getTreasuryState());
}

export async function POST(req: NextRequest) {
  const { npcId, amount, dfTokenAmount, action } = await req.json();
  if (!npcId) return NextResponse.json({ error: 'npcId required' }, { status: 400 });
  const result = action === 'withdraw'
    ? await defindexWithdraw({ npcId, dfTokenAmount: dfTokenAmount ?? amount })
    : await defindexDeposit({ npcId, amount });
  return NextResponse.json(result);
}
