#!/usr/bin/env node
/**
 * Stellar Native Escrow via Claimable Balance
 * Creates an on-chain claimable balance (escrow) on Stellar Testnet.
 * No Soroban compilation needed — uses Stellar's native protocol.
 *
 * Usage:
 *   node scripts/deploy/soroban/create-escrow.mjs
 *
 * Flow:
 *  1. Creates a funded deployer keypair
 *  2. Friendbot funds it
 *  3. Creates a claimable balance (escrow) claimable by your Freighter wallet
 *  4. Prints the balance ID to use in the app
 *
 * Set FREIGHTER_PUBLIC_KEY to your Freighter wallet public key.
 */

import StellarSdk from '@stellar/stellar-sdk';
import https from 'https';

const { Keypair, Networks, TransactionBuilder, Operation, Asset, Claimant, BASE_FEE, StrKey } = StellarSdk;

const NETWORK = 'testnet';
const HORIZON = 'https://horizon-testnet.stellar.org';
const FRIENDBOT = 'https://friendbot.stellar.org';

// ── Your Freighter wallet public key (recipient of the escrow) ────────────────
const FREIGHTER_PUBLIC = process.env.FREIGHTER_PUBLIC_KEY;
if (!FREIGHTER_PUBLIC || !StrKey.isValidEd25519PublicKey(FREIGHTER_PUBLIC)) {
  console.error('\n❌ Set FREIGHTER_PUBLIC_KEY to your Freighter wallet public key.');
  console.error('   Example: $env:FREIGHTER_PUBLIC_KEY="GXXXXXXXXXX..."');
  console.error('   (Open Freighter → copy your public key)\n');
  process.exit(1);
}

// ── Amount to lock in escrow ──────────────────────────────────────────────────
const ESCROW_AMOUNT = process.env.ESCROW_AMOUNT || '10'; // XLM

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(new Error(data)); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const server = new StellarSdk.Horizon.Server(HORIZON);

  // Generate ephemeral deployer key
  const deployer = Keypair.random();
  console.log('\n🔑 Ephemeral deployer: ' + deployer.publicKey());
  console.log('💧 Funding via Friendbot...');

  await fetchJson(`${FRIENDBOT}?addr=${deployer.publicKey()}`);
  console.log('   ✅ Funded!');

  const account = await server.loadAccount(deployer.publicKey());
  const fee = BASE_FEE;

  // Create claimable balance: locked for FREIGHTER_PUBLIC to claim
  // Unconditional claim (no time lock) — claimer can claim anytime
  const claimant = new Claimant(FREIGHTER_PUBLIC, Claimant.predicateUnconditional());

  const tx = new TransactionBuilder(account, {
    fee,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.createClaimableBalance({
        claimants: [claimant],
        asset: Asset.native(),
        amount: ESCROW_AMOUNT,
      })
    )
    .setTimeout(30)
    .build();

  tx.sign(deployer);
  const result = await server.submitTransaction(tx);

  // Extract balance ID from meta
  let balanceId = 'check horizon for balance ID';
  try {
    const meta = result.result_meta_xdr;
    // Balance ID is in the envelope
    const envelope = StellarSdk.xdr.TransactionMeta.fromXDR(meta, 'base64');
    const ops = envelope.v2().operations();
    for (const op of ops) {
      for (const change of op.changes()) {
        if (change.switch().name === 'ledgerEntryCreated') {
          const entry = change.created().data();
          if (entry.switch().name === 'claimableBalance') {
            balanceId = StellarSdk.xdr.ClaimableBalanceID.toXDR(
              entry.claimableBalance().balanceId()
            ).toString('hex');
            balanceId = '00000000' + balanceId.slice(8); // normalize
          }
        }
      }
    }
  } catch (_) {}

  console.log('\n══════════════════════════════════════════════════');
  console.log('✅  ESCROW CREADO en Stellar Testnet');
  console.log('══════════════════════════════════════════════════');
  console.log(`Balance ID: ${balanceId}`);
  console.log(`Monto:      ${ESCROW_AMOUNT} XLM`);
  console.log(`Claimable:  ${FREIGHTER_PUBLIC}`);
  console.log(`TX Hash:    ${result.hash}`);
  console.log('══════════════════════════════════════════════════');
  console.log(`\n🔍 Ver en: https://stellar.expert/explorer/testnet/tx/${result.hash}`);
  console.log(`\n💡 Para reclamar:`);
  console.log(`   https://laboratory.stellar.org/#explorer?network=testnet`);
  console.log(`   → Operations → Claim Claimable Balance → ID: ${balanceId}`);
}

main().catch((e) => {
  console.error('\n❌', e.response?.data || e.message);
  process.exit(1);
});
