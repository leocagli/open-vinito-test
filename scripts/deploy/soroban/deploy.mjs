#!/usr/bin/env node
/**
 * Deploy Soroban contracts to Stellar Testnet
 *
 * Pre-requisites (run ONCE):
 *   stellar keys generate deployer --network testnet
 *   stellar keys fund deployer --network testnet
 *
 * Usage:
 *   node scripts/deploy/soroban/deploy.mjs
 *
 * Output: NEXT_PUBLIC_STELLAR_ESCROW_CONTRACT_ID + NEXT_PUBLIC_STELLAR_REPUTATION_CONTRACT_ID
 */

import { execFileSync, execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '../../..');

// ── Helpers ───────────────────────────────────────────────────────────────────
function run(cmd, opts = {}) {
  console.log(`  $ ${cmd}`);
  return execSync(cmd, { stdio: opts.capture ? 'pipe' : 'inherit', ...opts })
    ?.toString()
    .trim();
}

function stellar(...args) {
  const result = execFileSync('stellar', args, { stdio: 'pipe' }).toString().trim();
  return result;
}

// ── Check stellar CLI ─────────────────────────────────────────────────────────
try {
  const v = stellar('--version');
  console.log(`✅ Stellar CLI: ${v}`);
} catch {
  console.error('\n❌ stellar CLI no encontrado.');
  console.error('   Instala con:  cargo install --locked stellar-cli --features opt');
  process.exit(1);
}

// ── Ensure deployer key exists ────────────────────────────────────────────────
let deployerExists = false;
try {
  stellar('keys', 'show', 'deployer');
  deployerExists = true;
  console.log('✅ Llave "deployer" encontrada.');
} catch {
  console.log('\n📝 Creando llave "deployer" en testnet...');
  run('stellar keys generate deployer --network testnet');
  deployerExists = true;
}

// Fund deployer from friendbot
console.log('\n💧 Fondeando deployer desde Friendbot...');
try {
  run('stellar keys fund deployer --network testnet');
} catch (e) {
  console.warn('  (Friendbot ya fondeó esta cuenta o error de red — continuando)');
}

// ── Build + Deploy ─────────────────────────────────────────────────────────────
function buildAndDeploy(contractName, contractDir) {
  const fullPath = resolve(ROOT, contractDir);
  console.log(`\n📦 Compilando ${contractName} en ${fullPath}...`);

  if (!existsSync(fullPath)) {
    console.error(`  ❌ Directorio no encontrado: ${fullPath}`);
    process.exit(1);
  }

  // Build
  execSync(`cargo build --manifest-path "${fullPath}/Cargo.toml" --target wasm32-unknown-unknown --release`, {
    stdio: 'inherit',
    env: { ...process.env },
  });

  // Find the wasm file
  const releaseDir = resolve(fullPath, 'target/wasm32-unknown-unknown/release');
  const wasmFile = resolve(releaseDir, `${contractName.replace(/-/g, '_')}.wasm`);

  if (!existsSync(wasmFile)) {
    // Try alternate naming
    const files = execSync(`dir "${releaseDir}" /b`).toString().split('\n').map(f => f.trim()).filter(f => f.endsWith('.wasm'));
    if (!files.length) {
      console.error(`  ❌ No se encontró ningún .wasm en ${releaseDir}`);
      process.exit(1);
    }
    console.log(`  Found wasm: ${files[0]}`);
    const altWasm = resolve(releaseDir, files[0]);
    return deployWasm(contractName, altWasm);
  }

  return deployWasm(contractName, wasmFile);
}

function deployWasm(contractName, wasmPath) {
  console.log(`\n🚀 Deployando ${contractName}...`);
  console.log(`  WASM: ${wasmPath}`);

  const contractId = stellar(
    'contract', 'deploy',
    '--wasm', wasmPath,
    '--source', 'deployer',
    '--network', 'testnet'
  );

  if (!contractId || !contractId.startsWith('C')) {
    console.error(`  ❌ Contract ID inesperado: ${contractId}`);
    process.exit(1);
  }

  console.log(`  ✅ ${contractName} → ${contractId}`);
  return contractId;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const escrowId = buildAndDeploy('stellar-escrow', 'contracts/stellar/escrow');
const reputationId = buildAndDeploy('stellar-reputation', 'contracts/stellar/reputation');

console.log('\n══════════════════════════════════════════════════');
console.log('✅  DEPLOY COMPLETO — agrega estas variables:');
console.log('══════════════════════════════════════════════════');
console.log(`NEXT_PUBLIC_STELLAR_ESCROW_CONTRACT_ID=${escrowId}`);
console.log(`NEXT_PUBLIC_STELLAR_REPUTATION_CONTRACT_ID=${reputationId}`);
console.log('══════════════════════════════════════════════════');
console.log('\n🔍 Verifica en: https://stellar.expert/explorer/testnet/contract/' + escrowId);
