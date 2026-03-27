#!/usr/bin/env node

import {
  AccountCreateTransaction,
  AccountId,
  Client,
  Hbar,
  PrivateKey,
  TransferTransaction,
} from '@hashgraph/sdk'

function parsePrivateKey(value) {
  if (value.startsWith('0x')) {
    return PrivateKey.fromStringECDSA(value)
  }

  return PrivateKey.fromString(value)
}

async function main() {
  const operatorIdRaw = process.env.HEDERA_OPERATOR_ID
  const operatorKeyRaw = process.env.HEDERA_OPERATOR_KEY

  if (!operatorIdRaw || !operatorKeyRaw) {
    throw new Error('Missing HEDERA_OPERATOR_ID or HEDERA_OPERATOR_KEY')
  }

  const operatorId = AccountId.fromString(operatorIdRaw)
  const operatorKey = parsePrivateKey(operatorKeyRaw)
  const client = Client.forTestnet().setOperator(operatorId, operatorKey)

  const recipientKey = PrivateKey.generateECDSA()
  const createTx = await new AccountCreateTransaction()
    .setKey(recipientKey.publicKey)
    .setInitialBalance(new Hbar(1))
    .execute(client)
  const createReceipt = await createTx.getReceipt(client)
  const recipientId = createReceipt.accountId

  if (!recipientId) {
    throw new Error('Recipient account was not created')
  }

  const memo = `agent:vendimia proof ${Date.now()}`.slice(0, 100)
  const paymentTx = await new TransferTransaction()
    .addHbarTransfer(operatorId, Hbar.fromTinybars(-10_000_000))
    .addHbarTransfer(recipientId, Hbar.fromTinybars(10_000_000))
    .setTransactionMemo(memo)
    .freezeWith(client)
    .sign(operatorKey)

  const submit = await paymentTx.execute(client)
  const receipt = await submit.getReceipt(client)

  console.log(`RECIPIENT_ID=${recipientId.toString()}`)
  console.log(`RECIPIENT_PRIVATE_KEY=${recipientKey.toStringRaw()}`)
  console.log(`PAYMENT_TX_ID=${submit.transactionId.toString()}`)
  console.log(`PAYMENT_STATUS=${receipt.status.toString()}`)
  console.log(`MEMO=${memo}`)
  console.log(`HASHSCAN=https://hashscan.io/testnet/transaction/${submit.transactionId.toString()}`)
}

main().catch((error) => {
  console.error(error.message || String(error))
  process.exit(1)
})