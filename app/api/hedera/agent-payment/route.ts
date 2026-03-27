import { NextResponse } from 'next/server'
import {
  executeAgentPayment,
  getHederaConfig,
  isValidAccountId,
} from '@/lib/hedera'

export const runtime = 'nodejs'

export async function GET() {
  const config = getHederaConfig()
  return NextResponse.json(config)
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      recipientId?: string
      amount?: string
      serviceId?: string
      agentGoal?: string
    }

    if (!body.recipientId || !body.amount || !body.serviceId || !body.agentGoal) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    }

    if (!isValidAccountId(body.recipientId)) {
      return NextResponse.json({ error: 'Invalid Hedera account ID' }, { status: 400 })
    }

    const memo = `agent:${body.serviceId} ${body.agentGoal}`
    const result = await executeAgentPayment({
      recipientId: body.recipientId,
      amount: body.amount,
      memo,
    })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Hedera payment failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}