#!/usr/bin/env node
/**
 * Deploy stellar_escrow.wasm to Stellar Testnet via Horizon JS SDK
 * No stellar-cli needed — uses @stellar/stellar-sdk directly.
 *
 * Usage:
 *   node scripts/deploy/soroban/deploy-wasm.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '../../..');

const WASM_PATH = resolve(ROOT, 'target/wasm32-unknown-unknown/release/stellar_escrow.wasm');
const HORIZON = 'https://horizon-testnet.stellar.org';
const RPC    = 'https://soroban-testnet.stellar.org';
const FRIENDBOT = 'https://friendbot.stellar.org';

// Dynamic import of stellar-sdk (ESM)
const sdk = await import('@stellar/stellar-sdk');
const { Keypair, Networks, TransactionBuilder, Operation, BASE_FEE } = sdk;
const SorobanRpc = sdk.rpc;

const { createHash } = await import('crypto');

function computeWasmHash(wasmBytes) {
  return createHash('sha256').update(wasmBytes).digest();
}

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function pollHorizonTx(hash, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const data = await fetchJson(`${HORIZON}/transactions/${hash}`);
    if (!data || data.status === 404 || data.title === 'Resource Missing') {
      process.stdout.write('.');
      continue;
    }
    if (data.successful === true) return { ok: true };
    if (data.hash && data.successful === false) return { ok: false, detail: data.result_xdr };
    process.stdout.write('.');
  }
  return { ok: false, detail: 'timeout' };
}

async function main() {
  // Read WASM
  let wasmBytes;
  try {
    wasmBytes = readFileSync(WASM_PATH);
  } catch {
    console.error(`\n❌ WASM not found at: ${WASM_PATH}`);
    console.error('   Run first: cargo +stable-x86_64-pc-windows-gnu build --manifest-path contracts/stellar/escrow/Cargo.toml --target wasm32-unknown-unknown --release');
    process.exit(1);
  }
  console.log(`\n📦 WASM loaded: ${(wasmBytes.length / 1024).toFixed(1)} KB`);

  // Generate deployer keypair and fund via Friendbot
  const deployer = Keypair.random();
  console.log(`🔑 Deployer: ${deployer.publicKey()}`);
  console.log('💧 Funding via Friendbot...');
  await fetchJson(`${FRIENDBOT}?addr=${deployer.publicKey()}`);
  console.log('   ✅ Funded!');

  // Connect to Soroban RPC
  const server = new SorobanRpc.Server(RPC, { allowHttp: false });
  const horizonServer = new sdk.Horizon.Server(HORIZON);

  // Get account
  const account = await horizonServer.loadAccount(deployer.publicKey());

  // Upload (install) contract WASM
  console.log('\n📤 Uploading WASM to Stellar Testnet...');
  const uploadTx = new TransactionBuilder(account, {
    fee: (BigInt(BASE_FEE) * 10n).toString(),
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.uploadContractWasm({ wasm: wasmBytes })
    )
    .setTimeout(60)
    .build();

  const simUpload = await server.simulateTransaction(uploadTx);
  if (SorobanRpc.Api.isSimulationError(simUpload)) {
    throw new Error('Simulation failed: ' + simUpload.error);
  }

  const preparedUpload = await server.prepareTransaction(uploadTx);
  preparedUpload.sign(deployer);

  const uploadResult = await server.sendTransaction(preparedUpload);
  console.log(`   TX hash: ${uploadResult.hash}`);

  // Poll for confirmation
  let wasmHash;
  {
    const result = await pollHorizonTx(uploadResult.hash);
    if (!result.ok) throw new Error('Upload TX failed or timed out: ' + result.detail);
    wasmHash = computeWasmHash(wasmBytes).toString('hex');
    console.log(`\n   ✅ WASM uploaded!`);
    console.log(`   WASM hash: ${wasmHash}`);
  }

  // Reload account (sequence number changed)
  const account2 = await horizonServer.loadAccount(deployer.publicKey());

  // Create (instantiate) contract
  console.log('\n🚀 Deploying contract instance...');
  const salt = crypto.getRandomValues(new Uint8Array(32));

  // Compute wasm hash from bytes
  if (!wasmHash) wasmHash = computeWasmHash(wasmBytes).toString('hex');

  const createTx = new TransactionBuilder(account2, {
    fee: (BigInt(BASE_FEE) * 10n).toString(),
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.createCustomContract({
        address: new sdk.Address(deployer.publicKey()),
        wasmHash: Buffer.from(wasmHash ?? '', 'hex'),
        salt: Buffer.from(salt),
      })
    )
    .setTimeout(60)
    .build();

  const simCreate = await server.simulateTransaction(createTx);
  if (SorobanRpc.Api.isSimulationError(simCreate)) {
    throw new Error('Simulation error: ' + simCreate.error);
  }

  // Try to read contractId from simulation returnValue before submitting
  let contractId;
  try {
    const simRetVal = simCreate.result?.retval ?? simCreate.result?.returnValue;
    if (simRetVal) {
      contractId = sdk.Address.fromScVal(simRetVal).toString();
      console.log(`   📋 Contract ID (from sim): ${contractId}`);
    }
  } catch {}

  const preparedCreate = await server.prepareTransaction(createTx);
  preparedCreate.sign(deployer);

  const createResult = await server.sendTransaction(preparedCreate);
  console.log(`   TX hash: ${createResult.hash}`);

  {
    const result = await pollHorizonTx(createResult.hash);
    if (!result.ok) throw new Error('Create TX failed or timed out: ' + result.detail);
    console.log(`\n   ✅ Contract deployed!`);
  }

  console.log('\n══════════════════════════════════════════════════');
  console.log('✅  STELLAR ESCROW DEPLOYADO en Testnet');
  console.log('══════════════════════════════════════════════════');
  if (contractId) {
    console.log(`NEXT_PUBLIC_STELLAR_ESCROW_CONTRACT_ID=${contractId}`);
  } else {
    console.log(`TX upload: ${uploadResult.hash}`);
    console.log(`TX create: ${createResult.hash}`);
    console.log('Check https://stellar.expert/explorer/testnet for contract ID');
  }
  console.log('══════════════════════════════════════════════════');
}

main().catch(e => {
  console.error('\n❌', e.message ?? e);
  process.exit(1);
});
