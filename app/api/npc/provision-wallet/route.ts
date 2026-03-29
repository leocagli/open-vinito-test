import { NextRequest, NextResponse } from 'next/server';
import { provisionNpcWallet, refreshNpcBalance, provisionAllNpcWallets, getNpcPublicKey } from '@/lib/npc-wallets';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Provision all NPCs at once
    if (body.npcIds && Array.isArray(body.npcIds)) {
      const wallets = await provisionAllNpcWallets(body.npcIds);
      return NextResponse.json({ wallets });
    }

    // Single NPC
    const { npcId, refresh } = body;
    if (!npcId) return NextResponse.json({ error: 'npcId required' }, { status: 400 });

    const wallet = refresh
      ? await refreshNpcBalance(npcId)
      : await provisionNpcWallet(npcId);

    return NextResponse.json({ npcId, wallet });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const npcId = req.nextUrl.searchParams.get('npcId');
  if (!npcId) return NextResponse.json({ error: 'npcId required' }, { status: 400 });
  const publicKey = getNpcPublicKey(npcId);
  return NextResponse.json({ npcId, publicKey });
}
