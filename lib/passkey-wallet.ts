// Passkey Smart Wallet — WebAuthn-based Stellar account
// Uses Stellar passkey smart contracts for seed-phrase-free login
// Based on Smart Account Kit by @kalepail

'use client';

// Smart Account Kit - loaded dynamically
async function getSmartAccountKit() {
  try {
    // The kit wraps Stellar passkey contracts
    // npm: @kalepail/smart-account-kit (install when available)
    // For now we implement the same interface using WebAuthn + Stellar
    return null;
  } catch {
    return null;
  }
}

export interface PasskeyWallet {
  contractId: string;
  publicKey: string;
  credentialId: string;
}

// ─── Register passkey (new user) ─────────────────────────────────────────
export async function registerPasskeyWallet(username: string): Promise<{
  wallet: PasskeyWallet | null;
  error: string | null;
}> {
  if (typeof window === 'undefined') return { wallet: null, error: 'Client only' };

  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'Vendimia World', id: window.location.hostname },
        user: {
          id: new TextEncoder().encode(username),
          name: username,
          displayName: username,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256
          { alg: -257, type: 'public-key' },  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'required',
        },
      },
    }) as PublicKeyCredential | null;

    if (!credential) return { wallet: null, error: 'Passkey creation cancelled' };

    const response = credential.response as AuthenticatorAttestationResponse;
    const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));

    // In production: deploy a Soroban passkey smart contract
    // and map credentialId → contract account
    const contractId = await deployPasskeyContract(credentialId);

    return {
      wallet: {
        contractId,
        publicKey: contractId,
        credentialId,
      },
      error: null,
    };
  } catch (err) {
    return {
      wallet: null,
      error: err instanceof Error ? err.message : 'Passkey registration failed',
    };
  }
}

// ─── Connect existing passkey ─────────────────────────────────────────────
export async function connectPasskeyWallet(): Promise<{
  wallet: PasskeyWallet | null;
  error: string | null;
}> {
  if (typeof window === 'undefined') return { wallet: null, error: 'Client only' };

  try {
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        userVerification: 'required',
        rpId: window.location.hostname,
      },
    }) as PublicKeyCredential | null;

    if (!credential) return { wallet: null, error: 'Passkey auth cancelled' };

    const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));

    // Look up the contract from the credential
    const contractId = await resolvePasskeyContract(credentialId);
    if (!contractId) return { wallet: null, error: 'No wallet found for this passkey' };

    return {
      wallet: { contractId, publicKey: contractId, credentialId },
      error: null,
    };
  } catch (err) {
    return {
      wallet: null,
      error: err instanceof Error ? err.message : 'Passkey auth failed',
    };
  }
}

// ─── Sign Stellar transaction with passkey ────────────────────────────────
export async function signWithPasskey(
  xdr: string,
  credentialId: string
): Promise<{ signedXdr: string | null; error: string | null }> {
  try {
    const challengeBytes = new TextEncoder().encode(xdr.slice(0, 32));
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: challengeBytes,
        userVerification: 'required',
        allowCredentials: [
          {
            type: 'public-key',
            id: Uint8Array.from(atob(credentialId), (c) => c.charCodeAt(0)),
          },
        ],
      },
    }) as PublicKeyCredential | null;

    if (!credential) return { signedXdr: null, error: 'Passkey sign cancelled' };

    // In production: submit signature to the smart contract's authorize method
    // The contract verifies the WebAuthn signature on-chain via Soroban
    return { signedXdr: xdr, error: null };
  } catch (err) {
    return {
      signedXdr: null,
      error: err instanceof Error ? err.message : 'Passkey sign failed',
    };
  }
}

// Stubs — replaced by Smart Account Kit contract deployment in production
async function deployPasskeyContract(_credentialId: string): Promise<string> {
  return `PASSKEY_CONTRACT_${_credentialId.slice(0, 8)}`;
}

async function resolvePasskeyContract(_credentialId: string): Promise<string | null> {
  return `PASSKEY_CONTRACT_${_credentialId.slice(0, 8)}`;
}
