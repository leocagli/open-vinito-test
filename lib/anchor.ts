// Anchor SEP protocols — fiat on/off-ramp via Stellar anchors
// Implements SEP-1 (info), SEP-6 (transfer), SEP-10 (auth), SEP-24 (interactive)
// Works with Etherfuse, AlfredPay, BlindPay and any SEP-compliant anchor

export interface AnchorInfo {
  baseUrl: string;
  assetCode: string;
  assetIssuer: string;
  sep6Url: string;
  sep24Url: string;
  sep10Url: string;
}

// Known anchors
export const ANCHORS: Record<string, AnchorInfo> = {
  etherfuse: {
    baseUrl: process.env.ETHERFUSE_BASE_URL || 'https://api.etherfuse.com',
    assetCode: 'USDCMX',
    assetIssuer: process.env.ETHERFUSE_ASSET_ISSUER || '',
    sep6Url: '/transactions',
    sep24Url: '/sep24/transactions',
    sep10Url: '/auth',
  },
  alfredpay: {
    baseUrl: process.env.ALFREDPAY_BASE_URL || 'https://api.alfredpay.io',
    assetCode: 'USDC',
    assetIssuer: process.env.ALFREDPAY_ASSET_ISSUER || '',
    sep6Url: '/transactions',
    sep24Url: '/sep24/transactions',
    sep10Url: '/auth',
  },
  blindpay: {
    baseUrl: process.env.BLINDPAY_BASE_URL || 'https://api.blindpay.com',
    assetCode: 'USDC',
    assetIssuer: process.env.BLINDPAY_ASSET_ISSUER || '',
    sep6Url: '/transactions',
    sep24Url: '/sep24/transactions',
    sep10Url: '/auth',
  },
};

// ─── SEP-1: Fetch anchor info ─────────────────────────────────────────────
export async function fetchAnchorInfo(anchorId: string): Promise<{
  info: any | null;
  error: string | null;
}> {
  const anchor = ANCHORS[anchorId];
  if (!anchor) return { info: null, error: `Unknown anchor: ${anchorId}` };

  try {
    const res = await fetch(`${anchor.baseUrl}/.well-known/stellar.toml`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { info: null, error: `TOML fetch failed: ${res.status}` };
    const toml = await res.text();
    return { info: { raw: toml }, error: null };
  } catch (err) {
    return { info: null, error: err instanceof Error ? err.message : 'Fetch failed' };
  }
}

// ─── SEP-6: Deposit (non-interactive) ────────────────────────────────────
export async function sep6Deposit(params: {
  anchorId: string;
  account: string;
  amount: string;
  authToken: string;
  assetCode?: string;
  email?: string;
}): Promise<{
  ok: boolean;
  how?: string;
  id?: string;
  eta?: number;
  error?: string;
}> {
  const anchor = ANCHORS[params.anchorId];
  if (!anchor) return { ok: false, error: `Unknown anchor: ${params.anchorId}` };

  const assetCode = params.assetCode ?? anchor.assetCode;

  try {
    const url = new URL(`${anchor.baseUrl}${anchor.sep6Url}/deposit`);
    url.searchParams.set('account', params.account);
    url.searchParams.set('asset_code', assetCode);
    url.searchParams.set('amount', params.amount);
    if (params.email) url.searchParams.set('email_address', params.email);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${params.authToken}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, error: `SEP-6 deposit failed: ${res.status}` };
    const data = await res.json();
    return { ok: true, how: data.how, id: data.id, eta: data.eta };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'SEP-6 deposit failed' };
  }
}

// ─── SEP-6: Withdraw ──────────────────────────────────────────────────────
export async function sep6Withdraw(params: {
  anchorId: string;
  account: string;
  amount: string;
  dest: string;
  authToken: string;
  assetCode?: string;
  type?: string;
}): Promise<{
  ok: boolean;
  accountId?: string;
  memo?: string;
  id?: string;
  error?: string;
}> {
  const anchor = ANCHORS[params.anchorId];
  if (!anchor) return { ok: false, error: `Unknown anchor: ${params.anchorId}` };

  const assetCode = params.assetCode ?? anchor.assetCode;

  try {
    const url = new URL(`${anchor.baseUrl}${anchor.sep6Url}/withdraw`);
    url.searchParams.set('account', params.account);
    url.searchParams.set('asset_code', assetCode);
    url.searchParams.set('amount', params.amount);
    url.searchParams.set('dest', params.dest);
    url.searchParams.set('type', params.type ?? 'bank_account');

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${params.authToken}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, error: `SEP-6 withdraw failed: ${res.status}` };
    const data = await res.json();
    return { ok: true, accountId: data.account_id, memo: data.memo, id: data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'SEP-6 withdraw failed' };
  }
}

// ─── SEP-24: Interactive deposit ─────────────────────────────────────────
export async function sep24Deposit(params: {
  anchorId: string;
  account: string;
  amount: string;
  authToken: string;
  assetCode?: string;
}): Promise<{
  ok: boolean;
  url?: string;
  id?: string;
  error?: string;
}> {
  const anchor = ANCHORS[params.anchorId];
  if (!anchor) return { ok: false, error: `Unknown anchor: ${params.anchorId}` };

  const assetCode = params.assetCode ?? anchor.assetCode;

  try {
    const res = await fetch(`${anchor.baseUrl}${anchor.sep24Url}/deposit/interactive`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.authToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        account: params.account,
        asset_code: assetCode,
        amount: params.amount,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, error: `SEP-24 deposit failed: ${res.status}` };
    const data = await res.json();
    return { ok: true, url: data.url, id: data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'SEP-24 deposit failed' };
  }
}

// ─── Transaction status polling ───────────────────────────────────────────
export async function getTransactionStatus(params: {
  anchorId: string;
  txId: string;
  authToken: string;
}): Promise<{ status: string | null; error?: string }> {
  const anchor = ANCHORS[params.anchorId];
  if (!anchor) return { status: null, error: `Unknown anchor: ${params.anchorId}` };

  try {
    const res = await fetch(
      `${anchor.baseUrl}${anchor.sep6Url}/transaction?id=${params.txId}`,
      {
        headers: { Authorization: `Bearer ${params.authToken}` },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return { status: null, error: `Status check failed: ${res.status}` };
    const data = await res.json();
    return { status: data.transaction?.status ?? 'unknown' };
  } catch (err) {
    return { status: null, error: err instanceof Error ? err.message : 'Status check failed' };
  }
}
