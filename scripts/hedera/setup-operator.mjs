#!/usr/bin/env node

import { AccountId, PrivateKey } from '@hashgraph/sdk'

function isValidOperatorId(value) {
  try {
    AccountId.fromString(value)
    return true
  } catch {
    return false
  }
}

function isValidOperatorKey(value) {
  try {
    if (value.startsWith('0x')) {
      PrivateKey.fromStringECDSA(value)
    } else {
      PrivateKey.fromString(value)
    }
    return true
  } catch {
    return false
  }
}

function printHeader(title) {
  console.log(`\n=== ${title} ===`)
}

function printPortalSteps() {
  printHeader('Get Hedera Testnet Operator')
  console.log('1. Open https://portal.hedera.com/register')
  console.log('2. Create a Testnet Account with email')
  console.log('3. After signup, copy:')
  console.log('   - Account ID    -> looks like 0.0.1234567')
  console.log('   - Private Key   -> long key string shown by the portal')
  console.log('4. Save them in your local env file as:')
  console.log('   HEDERA_NETWORK=testnet')
  console.log('   HEDERA_OPERATOR_ID=0.0.xxxxxxx')
  console.log('   HEDERA_OPERATOR_KEY=your_private_key')
}

function printEnvExample() {
  printHeader('PowerShell Example')
  console.log('$env:HEDERA_NETWORK="testnet"')
  console.log('$env:HEDERA_OPERATOR_ID="0.0.xxxxxxx"')
  console.log('$env:HEDERA_OPERATOR_KEY="your_private_key"')
  console.log('corepack pnpm dev')
}

function printEnvLocalExample() {
  printHeader('.env.local Example')
  console.log('HEDERA_NETWORK=testnet')
  console.log('HEDERA_OPERATOR_ID=0.0.xxxxxxx')
  console.log('HEDERA_OPERATOR_KEY=your_private_key')
}

function main() {
  const operatorId = process.env.HEDERA_OPERATOR_ID || ''
  const operatorKey = process.env.HEDERA_OPERATOR_KEY || ''
  const network = (process.env.HEDERA_NETWORK || 'testnet').toLowerCase()

  printHeader('Current Status')
  console.log(`HEDERA_NETWORK=${network}`)
  console.log(`HEDERA_OPERATOR_ID=${operatorId ? 'SET' : 'MISSING'}`)
  console.log(`HEDERA_OPERATOR_KEY=${operatorKey ? 'SET' : 'MISSING'}`)

  if (!operatorId || !operatorKey) {
    console.log('\nOperator env vars are not set yet.')
    printPortalSteps()
    printEnvExample()
    printEnvLocalExample()
    process.exit(0)
  }

  const validId = isValidOperatorId(operatorId)
  const validKey = isValidOperatorKey(operatorKey)

  printHeader('Validation')
  console.log(`Account ID valid: ${validId}`)
  console.log(`Private Key valid: ${validKey}`)

  if (!validId || !validKey) {
    console.log('\nOne or both Hedera values are malformed.')
    printPortalSteps()
    process.exit(1)
  }

  console.log('\nHedera operator env vars look valid.')
  console.log('You can now use the Hedera panel in the app or POST /api/hedera/agent-payment.')
}

main()