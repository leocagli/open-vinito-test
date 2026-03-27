#!/usr/bin/env node
/**
 * Genera una wallet BNB desechable para deploy en testnet.
 * Úsala SOLO en testnet — no envíes fondos reales a esta dirección.
 *
 * Usage: node scripts/deploy/evm/gen-wallet.mjs
 */
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log('\n══════════════════════════════════════════════════');
console.log('🔑  WALLET DEPLOY BNB TESTNET (desechable)');
console.log('══════════════════════════════════════════════════');
console.log(`Address:     ${account.address}`);
console.log(`Private Key: ${privateKey}`);
console.log('══════════════════════════════════════════════════');
console.log('\n⚠️  Guarda estos valores — esta pantalla no se repite.');
console.log('\n1. Fondea la address con tBNB:');
console.log('   https://testnet.bnbchain.org/faucet-smart');
console.log('\n2. Luego ejecuta el deploy:');
console.log(`   $env:DEPLOYER_PRIVATE_KEY="${privateKey}"`);
console.log('   node scripts/deploy/evm/deploy.mjs\n');
