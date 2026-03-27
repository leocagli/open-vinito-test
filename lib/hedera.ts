import {
  AccountId,
  AccountCreateTransaction,
  Client,
  Hbar,
  PrivateKey,
  Status,
  TransferTransaction,
} from '@hashgraph/sdk'

export type HederaNetwork = 'testnet' | 'mainnet'

export interface AgentPaymentInput {
  recipientId: string
  amount: string
  memo: string
}

function getNetwork(): HederaNetwork {
  const raw = (process.env.HEDERA_NETWORK || 'testnet').toLowerCase()
  return raw === 'mainnet' ? 'mainnet' : 'testnet'
}

function getExplorerBase(network: HederaNetwork) {
  return network === 'mainnet'
    ? 'https://hashscan.io/mainnet'
    : 'https://hashscan.io/testnet'
}

function getOperator() {
  const operatorId = process.env.HEDERA_OPERATOR_ID
  const operatorKey = process.env.HEDERA_OPERATOR_KEY

  if (!operatorId || !operatorKey) {
    throw new Error('Missing HEDERA_OPERATOR_ID or HEDERA_OPERATOR_KEY')
  }

  return {
    accountId: AccountId.fromString(operatorId),
    privateKey: parsePrivateKey(operatorKey),
  }
}

function parsePrivateKey(value: string) {
  if (value.startsWith('0x')) {
    return PrivateKey.fromStringECDSA(value)
  }

  return PrivateKey.fromString(value)
}

export function getHederaConfig() {
  const network = getNetwork()
  const configured = Boolean(process.env.HEDERA_OPERATOR_ID && process.env.HEDERA_OPERATOR_KEY)

  return {
    configured,
    network,
    mirrorExplorer: getExplorerBase(network),
    operatorId: process.env.HEDERA_OPERATOR_ID || null,
  }
}

export function createHederaClient() {
  const network = getNetwork()
  const operator = getOperator()
  const client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet()

  client.setOperator(operator.accountId, operator.privateKey)
  return {
    client,
    network,
    operator,
  }
}

export function isValidAccountId(value: string) {
  try {
    AccountId.fromString(value)
    return true
  } catch {
    return false
  }
}

function normalizeMemo(memo: string) {
  return memo.trim().replace(/\s+/g, ' ').slice(0, 100)
}

function parseAmount(amount: string) {
  const parsed = Number(amount)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('Invalid HBAR amount')
  }

  return Hbar.fromString(parsed.toString())
}

export async function executeAgentPayment(input: AgentPaymentInput) {
  const { client, network, operator } = createHederaClient()
  const recipient = AccountId.fromString(input.recipientId)
  const paymentAmount = parseAmount(input.amount)
  const memo = normalizeMemo(input.memo)

  const transaction = await new TransferTransaction()
    .addHbarTransfer(operator.accountId, paymentAmount.negated())
    .addHbarTransfer(recipient, paymentAmount)
    .setTransactionMemo(memo)
    .freezeWith(client)
    .sign(operator.privateKey)

  const submit = await transaction.execute(client)
  const receipt = await submit.getReceipt(client)
  const status = receipt.status.toString()

  return {
    status,
    success: receipt.status === Status.Success,
    transactionId: submit.transactionId.toString(),
    receiptStatus: status,
    network,
    explorerUrl: `${getExplorerBase(network)}/transaction/${submit.transactionId.toString()}`,
    memo,
    amount: paymentAmount.toString(),
    recipientId: recipient.toString(),
  }
}

export function isValidPrivateKey(value: string) {
  try {
    parsePrivateKey(value)
    return true
  } catch {
    return false
  }
}

export async function createRecipientAccount(initialBalance: string = '1') {
  const { client, network } = createHederaClient()
  const privateKey = PrivateKey.generateECDSA()

  const transaction = await new AccountCreateTransaction()
    .setKey(privateKey.publicKey)
    .setInitialBalance(Hbar.fromString(initialBalance))
    .execute(client)

  const receipt = await transaction.getReceipt(client)
  const accountId = receipt.accountId?.toString()

  if (!accountId) {
    throw new Error('Failed to create Hedera recipient account')
  }

  return {
    accountId,
    privateKey: privateKey.toStringRaw(),
    network,
  }
}