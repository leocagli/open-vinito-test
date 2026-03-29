// Stripe MPP — Machine Payments Protocol via Stripe
// Enables fiat machine-to-machine payments for in-game premium services
// Released March 18, 2026 — https://stripe.com/machine-payments

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY ?? '';
const STRIPE_PUBLISHABLE = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
const STRIPE_MPP_BASE = 'https://api.stripe.com/v1/machine_payments';

// ─── Create a machine payment session ────────────────────────────────────
export async function createMppSession(params: {
  agentId: string;
  serviceId: string;
  amountCents: number;
  currency?: string;
  description?: string;
}): Promise<{ sessionId: string | null; clientSecret: string | null; error: string | null }> {
  if (!STRIPE_SECRET) return { sessionId: null, clientSecret: null, error: 'Stripe not configured' };

  try {
    const res = await fetch(`${STRIPE_MPP_BASE}/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: String(params.amountCents),
        currency: params.currency ?? 'usd',
        'metadata[agent_id]': params.agentId,
        'metadata[service_id]': params.serviceId,
        description: params.description ?? `Vendimia service: ${params.serviceId}`,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const err = await res.json();
      return { sessionId: null, clientSecret: null, error: err.error?.message ?? 'Stripe error' };
    }
    const data = await res.json();
    return { sessionId: data.id, clientSecret: data.client_secret, error: null };
  } catch (err) {
    return { sessionId: null, clientSecret: null, error: err instanceof Error ? err.message : 'Stripe MPP failed' };
  }
}

// ─── Verify a machine payment ─────────────────────────────────────────────
export async function verifyMppPayment(sessionId: string): Promise<{
  paid: boolean;
  amountCents?: number;
  error?: string;
}> {
  if (!STRIPE_SECRET) return { paid: false, error: 'Stripe not configured' };

  try {
    const res = await fetch(`${STRIPE_MPP_BASE}/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${STRIPE_SECRET}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { paid: false, error: `Verification failed: ${res.status}` };
    const data = await res.json();
    return { paid: data.status === 'complete', amountCents: data.amount };
  } catch (err) {
    return { paid: false, error: err instanceof Error ? err.message : 'Verification failed' };
  }
}

// ─── One-time charge (no session, direct debit) ───────────────────────────
export async function mppDirectCharge(params: {
  agentId: string;
  paymentMethod: string;
  amountCents: number;
  currency?: string;
}): Promise<{ ok: boolean; chargeId?: string; error?: string }> {
  if (!STRIPE_SECRET) return { ok: false, error: 'Stripe not configured' };

  try {
    const res = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: String(params.amountCents),
        currency: params.currency ?? 'usd',
        payment_method: params.paymentMethod,
        confirm: 'true',
        'metadata[agent_id]': params.agentId,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const err = await res.json();
      return { ok: false, error: err.error?.message ?? 'Charge failed' };
    }
    const data = await res.json();
    return { ok: data.status === 'succeeded', chargeId: data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Charge failed' };
  }
}

export const STRIPE_CONFIG = {
  publishableKey: STRIPE_PUBLISHABLE,
  configured: Boolean(STRIPE_SECRET),
};
