import { NextRequest, NextResponse } from 'next/server';
import { createMppSession, verifyMppPayment, mppDirectCharge, STRIPE_CONFIG } from '@/lib/stripe-mpp';

export async function GET() {
  return NextResponse.json({ configured: STRIPE_CONFIG.configured });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  switch (action) {
    case 'create_session':
      return NextResponse.json(await createMppSession(body));

    case 'verify':
      return NextResponse.json(await verifyMppPayment(body.sessionId));

    case 'direct_charge':
      return NextResponse.json(await mppDirectCharge(body));

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
