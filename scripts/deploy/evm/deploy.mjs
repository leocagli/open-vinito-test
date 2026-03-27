#!/usr/bin/env node
/**
 * Deploy EscrowMilestone + X402ServicePaywall to BNB Testnet (chainId 97)
 *
 * Usage:
 *   DEPLOYER_PRIVATE_KEY=0x... node scripts/deploy/evm/deploy.mjs
 *
 * Requisites:
 *   - DEPLOYER_PRIVATE_KEY  : private key with BNB testnet funds
 *   - BNB testnet faucet: https://testnet.bnbchain.org/faucet-smart
 */

import { readFileSync } from 'fs';
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bscTestnet } from 'viem/chains';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const solc = require('solc');

// ── Config ────────────────────────────────────────────────────────────────────
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error('\nERROR: Set DEPLOYER_PRIVATE_KEY environment variable.');
  console.error('  Windows PowerShell:');
  console.error('    $env:DEPLOYER_PRIVATE_KEY="0xyour_private_key_here"');
  console.error('    node scripts/deploy/evm/deploy.mjs\n');
  process.exit(1);
}

const RPC = 'https://data-seed-prebsc-1-s1.binance.org:8545';
const CONTRACTS_DIR = new URL('../../../contracts/evm/', import.meta.url).pathname
  .replace(/^\/([A-Z]:)/, '$1'); // fix Windows drive letter

// ── Compile ───────────────────────────────────────────────────────────────────
function compileSolidity(name, sourcePath) {
  console.log(`\n📦 Compilando ${name}...`);
  const source = readFileSync(sourcePath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: { [`${name}.sol`]: { content: source } },
    settings: {
      evmVersion: 'paris',
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const errors = output.errors.filter((e) => e.severity === 'error');
    if (errors.length) {
      for (const e of errors) console.error('  ❌', e.formattedMessage);
      process.exit(1);
    }
    for (const w of output.errors) console.warn('  ⚠️ ', w.message);
  }

  const contract = output.contracts[`${name}.sol`][name];
  return {
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`,
  };
}

// ── Deploy ────────────────────────────────────────────────────────────────────
async function deployContract(name, abi, bytecode, walletClient, publicClient) {
  console.log(`\n🚀 Deployando ${name} en BNB Testnet...`);

  const hash = await walletClient.deployContract({
    abi,
    bytecode,
    args: [],
  });

  console.log(`  TX hash: ${hash}`);
  console.log('  Esperando confirmación...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (!receipt.contractAddress) {
    throw new Error(`Deploy de ${name} falló - sin contractAddress en receipt`);
  }

  console.log(`  ✅ ${name} deployado en: ${receipt.contractAddress}`);
  return receipt.contractAddress;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log(`\n👛 Deployer: ${account.address}`);

  const publicClient = createPublicClient({ chain: bscTestnet, transport: http(RPC) });
  const walletClient = createWalletClient({ account, chain: bscTestnet, transport: http(RPC) });

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  const balanceBnb = Number(balance) / 1e18;
  console.log(`   Balance: ${balanceBnb.toFixed(4)} tBNB`);
  if (balanceBnb < 0.01) {
    console.error('\n❌ Balance insuficiente. Obtén tBNB en: https://testnet.bnbchain.org/faucet-smart');
    process.exit(1);
  }

  // Compile
  const escrow = compileSolidity('EscrowMilestone', CONTRACTS_DIR + 'EscrowMilestone.sol');
  const x402 = compileSolidity('X402ServicePaywall', CONTRACTS_DIR + 'X402ServicePaywall.sol');

  // Deploy
  const escrowAddress = await deployContract('EscrowMilestone', escrow.abi, escrow.bytecode, walletClient, publicClient);
  const x402Address = await deployContract('X402ServicePaywall', x402.abi, x402.bytecode, walletClient, publicClient);

  // Output
  console.log('\n══════════════════════════════════════════════════');
  console.log('✅  DEPLOY COMPLETO — agrega estas variables:');
  console.log('══════════════════════════════════════════════════');
  console.log(`NEXT_PUBLIC_BNB_ESCROW_CONTRACT=${escrowAddress}`);
  console.log(`NEXT_PUBLIC_BNB_X402_CONTRACT=${x402Address}`);
  console.log('══════════════════════════════════════════════════');
  console.log('\n🔍 Verifica en: https://testnet.bscscan.com/address/' + escrowAddress);
}

main().catch((e) => { console.error('\n❌ Error:', e.message); process.exit(1); });
