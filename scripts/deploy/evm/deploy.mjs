#!/usr/bin/env node
/**
 * Deploy EscrowMilestone and/or X402ServicePaywall to BNB testnet or mainnet.
 *
 * Usage:
 *   DEPLOYER_PRIVATE_KEY=0x... EVM_NETWORK=mainnet EVM_CONTRACTS=x402 node scripts/deploy/evm/deploy.mjs
 */

import { readFileSync } from 'fs';
import { createWalletClient, createPublicClient, formatEther, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bsc, bscTestnet } from 'viem/chains';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const solc = require('solc');

// ── Config ────────────────────────────────────────────────────────────────────
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error('\nERROR: Set DEPLOYER_PRIVATE_KEY environment variable.');
  console.error('  Windows PowerShell:');
  console.error('    $env:DEPLOYER_PRIVATE_KEY="0xyour_private_key_here"');
  console.error('    $env:EVM_NETWORK="mainnet"');
  console.error('    node scripts/deploy/evm/deploy.mjs\n');
  process.exit(1);
}

const CONTRACTS_DIR = new URL('../../../contracts/evm/', import.meta.url).pathname
  .replace(/^\/([A-Z]:)/, '$1'); // fix Windows drive letter

const NETWORKS = {
  testnet: {
    key: 'testnet',
    label: 'BNB Testnet',
    chain: bscTestnet,
    rpc: process.env.BNB_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545',
    explorerAddress: 'https://testnet.bscscan.com/address/',
    nativeSymbol: 'tBNB',
  },
  mainnet: {
    key: 'mainnet',
    label: 'BNB Mainnet',
    chain: bsc,
    rpc: process.env.BNB_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org',
    explorerAddress: 'https://bscscan.com/address/',
    nativeSymbol: 'BNB',
  },
};

const networkKey = (process.env.EVM_NETWORK || process.env.BNB_NETWORK || 'testnet').toLowerCase();
const network = NETWORKS[networkKey];

if (!network) {
  console.error(`\nERROR: Unsupported EVM_NETWORK: ${networkKey}`);
  console.error('  Use one of: testnet, mainnet\n');
  process.exit(1);
}

const contractSelection = new Set(
  (process.env.EVM_CONTRACTS || 'escrow,x402')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
);

if (contractSelection.size === 0) {
  console.error('\nERROR: EVM_CONTRACTS resolved to an empty list.');
  console.error('  Example: EVM_CONTRACTS=x402 or EVM_CONTRACTS=escrow,x402\n');
  process.exit(1);
}

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
  console.log(`\n🚀 Deployando ${name} en ${network.label}...`);

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
  console.log(`🌐 Network: ${network.label} (chainId ${network.chain.id})`);

  const publicClient = createPublicClient({ chain: network.chain, transport: http(network.rpc) });
  const walletClient = createWalletClient({ account, chain: network.chain, transport: http(network.rpc) });

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`   Balance: ${formatEther(balance)} ${network.nativeSymbol}`);
  if (balance === 0n) {
    console.error(`\n❌ Balance insuficiente en ${network.label}.`);
    process.exit(1);
  }

  const deployments = [];

  if (contractSelection.has('escrow')) {
    const escrow = compileSolidity('EscrowMilestone', CONTRACTS_DIR + 'EscrowMilestone.sol');
    deployments.push({
      envKey: 'NEXT_PUBLIC_BNB_ESCROW_CONTRACT',
      name: 'EscrowMilestone',
      compiled: escrow,
    });
  }

  if (contractSelection.has('x402')) {
    const x402 = compileSolidity('X402ServicePaywall', CONTRACTS_DIR + 'X402ServicePaywall.sol');
    deployments.push({
      envKey: 'NEXT_PUBLIC_BNB_X402_CONTRACT',
      name: 'X402ServicePaywall',
      compiled: x402,
    });
  }

  if (deployments.length === 0) {
    console.error('\n❌ No hay contratos válidos para desplegar. Usa escrow y/o x402.');
    process.exit(1);
  }

  const deployedContracts = [];
  for (const deployment of deployments) {
    const address = await deployContract(
      deployment.name,
      deployment.compiled.abi,
      deployment.compiled.bytecode,
      walletClient,
      publicClient
    );

    deployedContracts.push({
      ...deployment,
      address,
    });
  }

  // Output
  console.log('\n══════════════════════════════════════════════════');
  console.log(`✅  DEPLOY COMPLETO EN ${network.label.toUpperCase()}`);
  console.log('══════════════════════════════════════════════════');
  for (const deployment of deployedContracts) {
    console.log(`${deployment.envKey}=${deployment.address}`);
  }
  console.log('══════════════════════════════════════════════════');
  for (const deployment of deployedContracts) {
    console.log(`🔍 ${deployment.name}: ${network.explorerAddress}${deployment.address}`);
  }
}

main().catch((e) => { console.error('\n❌ Error:', e.message); process.exit(1); });
