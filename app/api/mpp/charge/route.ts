import { NextRequest, NextResponse } from 'next/server';
import { mppCharge, mppOpenChannel, mppChannelPay, mppCloseChannel, getChannels } from '@/lib/mpp';

export async function GET() {
  return NextResponse.json({ channels: getChannels() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  switch (action) {
    case 'charge':
      return NextResponse.json(await mppCharge(body));

    case 'open_channel': {
      const channel = mppOpenChannel(body);
      return NextResponse.json({ ok: true, channel });
    }

    case 'channel_pay': {
      const result = mppChannelPay({ channelId: body.channelId, amount: body.amount });
      return NextResponse.json(result);
    }

    case 'close_channel':
      return NextResponse.json(await mppCloseChannel(body.channelId));

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
