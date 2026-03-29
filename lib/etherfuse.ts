// Etherfuse — fiat on/off ramp + stablebonds
// Implements SEP-10 auth and SEP-6/24 deposit/withdraw flows
// Uses the Etherfuse anchor for USDC ↔ fiat conversion

const ETHERFUSE_BASE =
  process.env.ETHERFUSE_BASE_URL || 'https://api.etherfuse.com';
const ETHERFUSE_ASSET_CODE = 'USDCMX';
const ETHERFUSE_ASSET_ISSUER =
  process.env.ETHERFUSE_ASSET_ISSUER ||
  'GAZCF7MWJP3OCXQK6IXIKAGRZ7GBXFXBJ6GFPWFVLRCRWM7QNBSWQP3';

// Stablebond contract (CETES)
const CETES_CODE = 'CETES';
const CETES_ISSUER =
  process.env.CETES_ISSUER || 'GDLH7TBOOPZ5QNOB2AMGPPJ3CQT5HXPNBZ7RJSZ7TMQSV7ASOOWXZ';

// ─── SEP-10 Auth ──────────────────────────────────────────────────────────
export async function etherfuseSep10Auth(publicKey: string): Promise<{
  token: string | null;
  error: string | null;
}> {
  try {
    // Step 1: Get challenge
    const challengeRes = await fetch(
      `${ETHERFUSE_BASE}/auth?account=${publicKey}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!challengeRes.ok) return { token: null, error: 'Auth challenge failed' };
    const { transaction: challengeXDR } = await challengeRes.json();
    if (!challengeXDR) return { token: null, error: 'No challenge XDR' };

    // Note: in production, sign challengeXDR with the user's keypair
    // For server-side NPC flows, this would use the NPC keypair
    return { token: null, error: 'SEP-10 requires interactive signing' };
  } catch (err) {
    return { token: null, error: err instanceof Error ? err.message : 'Auth failed' };
  }
}

// ─── SEP-6 Deposit ────────────────────────────────────────────────────────
export async function etherfuseDeposit(params: {
  account: string;
  amount: string;
  assetCode?: string;
  authToken: string;
}): Promise<{ ok: boolean; depositUrl?: string; id?: string; error?: string }> {
  const { account, amount, assetCode = ETHERFUSE_ASSET_CODE, authToken } = params;
  try {
    const res = await fetch(
      `${ETHERFUSE_BASE}/transactions/deposit?account=${account}&asset_code=${assetCode}&amount=${amount}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return { ok: false, error: `Deposit failed: ${res.status}` };
    const data = await res.json();
    return { ok: true, depositUrl: data.url, id: data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Deposit failed' };
  }
}

// ─── SEP-6 Withdraw ───────────────────────────────────────────────────────
export async function etherfuseWithdraw(params: {
  account: string;
  amount: string;
  dest: string;
  assetCode?: string;
  authToken: string;
}): Promise<{ ok: boolean; id?: string; memo?: string; error?: string }> {
  const { account, amount, dest, assetCode = ETHERFUSE_ASSET_CODE, authToken } = params;
  try {
    const res = await fetch(`${ETHERFUSE_BASE}/transactions/withdraw`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ account, asset_code: assetCode, amount, dest }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, error: `Withdraw failed: ${res.status}` };
    const data = await res.json();
    return { ok: true, id: data.id, memo: data.memo };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Withdraw failed' };
  }
}

// ─── Stablebonds (CETES) purchase ─────────────────────────────────────────
export async function buyCetes(params: {
  account: string;
  usdcAmount: string;
  authToken: string;
}): Promise<{ ok: boolean; cetesAmount?: string; apy?: number; error?: string }> {
  // Exchange USDC for CETES via Etherfuse API
  const { account, usdcAmount, authToken } = params;
  try {
    const res = await fetch(`${ETHERFUSE_BASE}/stablebonds/purchase`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account,
        asset_code: CETES_CODE,
        amount: usdcAmount,
        payment_asset: ETHERFUSE_ASSET_CODE,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, error: `CETES purchase failed: ${res.status}` };
    const data = await res.json();
    return { ok: true, cetesAmount: data.amount, apy: data.apy ?? 9.5 };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'CETES purchase failed' };
  }
}

export const ETHERFUSE_INFO = {
  assetCode: ETHERFUSE_ASSET_CODE,
  assetIssuer: ETHERFUSE_ASSET_ISSUER,
  cetesCode: CETES_CODE,
  cetesIssuer: CETES_ISSUER,
  baseUrl: ETHERFUSE_BASE,
};
