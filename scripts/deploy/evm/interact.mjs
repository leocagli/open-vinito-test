#!/usr/bin/env node
/**
 * Sends a real settle402 transaction and verifies the stored payment reference.
 *
 * Usage:
 *   DEPLOYER_PRIVATE_KEY=0x... EVM_NETWORK=mainnet X402_CONTRACT=0x... node scripts/deploy/evm/interact.mjs
 */

import {
  createWalletClient,
  createPublicClient,
  formatEther,
  http,
  keccak256,
  parseEther,
  stringToHex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bsc, bscTestnet } from 'viem/chains';

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const CONTRACT = process.env.X402_CONTRACT || process.env.NEXT_PUBLIC_BNB_X402_CONTRACT;
const PAYMENT_REF = process.env.X402_PAYMENT_REF || `open-vinito-${Date.now()}`;
const PAYMENT_AMOUNT = process.env.X402_AMOUNT_BNB || '0.000001';

if (!PRIVATE_KEY) {
  console.error('\nERROR: Set DEPLOYER_PRIVATE_KEY environment variable.\n');
  process.exit(1);
}

if (!CONTRACT) {
  console.error('\nERROR: Set X402_CONTRACT or NEXT_PUBLIC_BNB_X402_CONTRACT.\n');
  process.exit(1);
}

const NETWORKS = {
  testnet: {
    label: 'BNB Testnet',
    chain: bscTestnet,
    rpc: process.env.BNB_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545',
    explorerTx: 'https://testnet.bscscan.com/tx/',
  },
  mainnet: {
    label: 'BNB Mainnet',
    chain: bsc,
    rpc: process.env.BNB_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org',
    explorerTx: 'https://bscscan.com/tx/',
  },
};

const networkKey = (process.env.EVM_NETWORK || process.env.BNB_NETWORK || 'testnet').toLowerCase();
const network = NETWORKS[networkKey];

if (!network) {
  console.error(`\nERROR: Unsupported EVM_NETWORK: ${networkKey}\n`);
  process.exit(1);
}

const X402_ABI = [
  {
    inputs: [{ name: 'paymentRefHash', type: 'bytes32' }],
    name: 'settle402',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'paymentRefHash', type: 'bytes32' }],
    name: 'hasPaid',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] ;

async function main() {
  const account = privateKeyToAccount(PRIVATE_KEY);
  const paymentRefHash = keccak256(stringToHex(PAYMENT_REF));
  const publicClient = createPublicClient({ chain: network.chain, transport: http(network.rpc) });
  const walletClient = createWalletClient({ account, chain: network.chain, transport: http(network.rpc) });

  console.log(`\n👛 Sender: ${account.address}`);
  console.log(`🌐 Network: ${network.label} (chainId ${network.chain.id})`);
  console.log(`📄 Contract: ${CONTRACT}`);
  console.log(`🔖 Ref: ${PAYMENT_REF}`);
  console.log(`#️⃣ Ref hash: ${paymentRefHash}`);

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`💰 Balance: ${formatEther(balance)} ${network.chain.nativeCurrency.symbol}`);

  const hash = await walletClient.writeContract({
    address: CONTRACT,
    abi: X402_ABI,
    functionName: 'settle402',
    args: [paymentRefHash],
    value: parseEther(PAYMENT_AMOUNT),
    account,
    chain: network.chain,
  });

  console.log(`\n🚀 settle402 tx: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`✅ Confirmada en bloque ${receipt.blockNumber}`);

  const hasPaid = await publicClient.readContract({
    address: CONTRACT,
    abi: X402_ABI,
    functionName: 'hasPaid',
    args: [paymentRefHash],
  });

  console.log(`🔍 hasPaid(${paymentRefHash}): ${hasPaid}`);
  console.log(`🔗 Explorer: ${network.explorerTx}${hash}`);

  if (!hasPaid) {
    throw new Error('Verification failed: hasPaid returned false');
  }
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message || error);
  process.exit(1);
});