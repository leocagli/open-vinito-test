import { NextRequest, NextResponse } from 'next/server';
import { blendDeposit, blendWithdraw, getBlendPosition, getAllBlendPositions } from '@/lib/blend';

export async function GET(req: NextRequest) {
  const npcId = req.nextUrl.searchParams.get('npcId');
  if (npcId) return NextResponse.json(getBlendPosition(npcId) ?? { error: 'No position' });
  return NextResponse.json({ positions: getAllBlendPositions() });
}

export async function POST(req: NextRequest) {
  const { npcId, amount, action } = await req.json();
  if (!npcId || !amount) return NextResponse.json({ error: 'npcId and amount required' }, { status: 400 });
  const result = action === 'withdraw'
    ? await blendWithdraw({ npcId, amount })
    : await blendDeposit({ npcId, amount });
  return NextResponse.json(result);
}
