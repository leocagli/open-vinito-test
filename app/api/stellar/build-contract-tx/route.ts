import { NextResponse } from 'next/server'
import * as StellarSdk from '@stellar/stellar-sdk'

const HORIZON = 'https://horizon-testnet.stellar.org'
const SOROBAN_RPC = 'https://soroban-testnet.stellar.org'

type ArgType = 'u64' | 'i128' | 'i32' | 'address' | 'string'

interface ContractArg {
  type: ArgType
  value: string | number
}

function parseContractArg(arg: ContractArg, sourcePublic: string) {
  const normalizedValue = arg.value === 'SOURCE' ? sourcePublic : arg.value

  switch (arg.type) {
    case 'u64':
      return StellarSdk.nativeToScVal(BigInt(Number(normalizedValue)), { type: 'u64' })
    case 'i128':
      return StellarSdk.nativeToScVal(BigInt(Number(normalizedValue)), { type: 'i128' })
    case 'i32':
      return StellarSdk.nativeToScVal(Number(normalizedValue), { type: 'i32' })
    case 'address': {
      const address = String(normalizedValue)
      if (!StellarSdk.StrKey.isValidEd25519PublicKey(address)) {
        throw new Error('Invalid Stellar address in contract args')
      }
      return new StellarSdk.Address(address).toScVal()
    }
    case 'string':
      return StellarSdk.nativeToScVal(String(normalizedValue), { type: 'string' })
    default:
      throw new Error('Unsupported argument type')
  }
}

export async function POST(req: Request) {
  try {
    const { sourcePublic, contractId, method, args } = await req.json() as {
      sourcePublic?: string
      contractId?: string
      method?: string
      args?: ContractArg[]
    }

    if (!sourcePublic || !contractId || !method || !Array.isArray(args)) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    }

    if (!StellarSdk.StrKey.isValidEd25519PublicKey(sourcePublic)) {
      return NextResponse.json({ error: 'Invalid sourcePublic' }, { status: 400 })
    }

    const horizon = new StellarSdk.Horizon.Server(HORIZON)
    const soroban = new StellarSdk.rpc.Server(SOROBAN_RPC)
    const sourceAccount = await horizon.loadAccount(sourcePublic)

    const op = StellarSdk.Operation.invokeContractFunction({
      contract: contractId,
      function: method,
      args: args.map((arg) => parseContractArg(arg, sourcePublic)),
    })

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(op)
      .setTimeout(180)
      .build()

    const prepared = await soroban.prepareTransaction(tx)
    return NextResponse.json({ xdr: prepared.toXDR() })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
