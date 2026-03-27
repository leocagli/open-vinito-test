'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface HederaStatus {
  configured: boolean
  network: 'testnet' | 'mainnet'
  mirrorExplorer: string
  operatorId: string | null
}

interface HederaPaymentResult {
  success: boolean
  transactionId: string
  receiptStatus: string
  explorerUrl: string
  memo: string
  amount: string
  recipientId: string
  network: 'testnet' | 'mainnet'
}

export function AgentPaymentsPanel() {
  const [status, setStatus] = useState<HederaStatus | null>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recipientId, setRecipientId] = useState('0.0.1234567')
  const [amount, setAmount] = useState('0.1')
  const [serviceId, setServiceId] = useState('vendimia-agent')
  const [agentGoal, setAgentGoal] = useState('settlement for verified delivery milestone')
  const [result, setResult] = useState<HederaPaymentResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadStatus() {
      try {
        const response = await fetch('/api/hedera/agent-payment')
        const data = await response.json()
        if (!cancelled) {
          setStatus(data)
        }
      } catch {
        if (!cancelled) {
          setError('No se pudo consultar el estado de Hedera')
        }
      } finally {
        if (!cancelled) {
          setIsLoadingStatus(false)
        }
      }
    }

    loadStatus()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setResult(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/hedera/agent-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId,
          amount,
          serviceId,
          agentGoal,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo enviar el pago')
      }

      setResult(data)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Error desconocido')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="pointer-events-auto fixed left-4 bottom-4 z-40 w-[min(30rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border-4 shadow-[8px_8px_0_rgba(0,0,0,0.28)]"
      style={{
        background: 'linear-gradient(160deg, rgba(17,46,66,0.96), rgba(7,86,117,0.94))',
        borderColor: '#08263a',
        color: '#eefafc',
      }}
    >
      <div className="border-b-4 px-5 py-4" style={{ borderColor: '#0d3b52', background: 'rgba(5, 24, 36, 0.32)' }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-cyan-200/80">Hedera Track</p>
            <h2 className="font-vt323 text-3xl leading-none">Agentic HBAR Payments</h2>
          </div>
          <span
            className="rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-[0.22em]"
            style={{
              borderColor: status?.configured ? '#9ef0d4' : '#f8d17d',
              color: status?.configured ? '#c8fff0' : '#fff0bc',
              background: 'rgba(255,255,255,0.08)',
            }}
          >
            {isLoadingStatus ? 'loading' : status?.configured ? `${status.network} ready` : 'env missing'}
          </span>
        </div>
        <p className="mt-3 text-sm text-cyan-50/78">
          MVP para el track de Hedera: un agente liquida pagos HBAR con memo semántico para dejar rastro de servicio,
          milestone y objetivo del agente.
        </p>
      </div>

      <div className="space-y-4 px-5 py-4 text-sm">
        <div className="grid gap-2 rounded-xl border p-3" style={{ borderColor: 'rgba(201, 245, 255, 0.18)', background: 'rgba(0,0,0,0.18)' }}>
          <div className="flex items-center justify-between gap-3 text-[0.74rem] uppercase tracking-[0.18em] text-cyan-100/70">
            <span>Fit con el track</span>
            <span>{status?.network || 'testnet'}</span>
          </div>
          <p className="text-cyan-50/84">Pagos instantáneos, costo bajo, trazabilidad por memo y backend listo para enchufar agentes autónomos.</p>
          {status?.operatorId && (
            <p className="text-cyan-100/64">Operator: {status.operatorId}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block space-y-1">
            <span className="text-[0.72rem] uppercase tracking-[0.18em] text-cyan-100/70">Cuenta receptora</span>
            <input
              value={recipientId}
              onChange={(event) => setRecipientId(event.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              style={{ borderColor: '#1d596f', background: 'rgba(255,255,255,0.08)' }}
              placeholder="0.0.123456"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-[0.72rem] uppercase tracking-[0.18em] text-cyan-100/70">HBAR</span>
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ borderColor: '#1d596f', background: 'rgba(255,255,255,0.08)' }}
                placeholder="0.1"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[0.72rem] uppercase tracking-[0.18em] text-cyan-100/70">Service ID</span>
              <input
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ borderColor: '#1d596f', background: 'rgba(255,255,255,0.08)' }}
                placeholder="vendimia-agent"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-[0.72rem] uppercase tracking-[0.18em] text-cyan-100/70">Objetivo del agente</span>
            <textarea
              value={agentGoal}
              onChange={(event) => setAgentGoal(event.target.value)}
              rows={3}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              style={{ borderColor: '#1d596f', background: 'rgba(255,255,255,0.08)' }}
              placeholder="settlement for verified delivery milestone"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting || !status?.configured}
            className="w-full rounded-xl border px-4 py-3 text-[0.8rem] font-semibold uppercase tracking-[0.18em] transition-opacity disabled:cursor-not-allowed disabled:opacity-55"
            style={{ borderColor: '#8de9cc', background: 'linear-gradient(135deg, #19b37d, #68d2b5)', color: '#07252d' }}
          >
            {isSubmitting ? 'Enviando pago Hedera...' : 'Disparar pago agéntico'}
          </button>
        </form>

        {error && (
          <div className="rounded-xl border px-3 py-3 text-sm" style={{ borderColor: '#ffb46d', background: 'rgba(87, 35, 0, 0.35)', color: '#ffe3bf' }}>
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-2 rounded-xl border px-3 py-3 text-sm" style={{ borderColor: '#7fe2c7', background: 'rgba(6, 56, 52, 0.42)' }}>
            <p className="text-[0.72rem] uppercase tracking-[0.18em] text-cyan-100/70">Pago confirmado</p>
            <p>Tx ID: {result.transactionId}</p>
            <p>Estado: {result.receiptStatus}</p>
            <p>Memo: {result.memo}</p>
            <p>Destino: {result.recipientId}</p>
            <a href={result.explorerUrl} target="_blank" rel="noreferrer" className="inline-block underline underline-offset-4">
              Ver en HashScan
            </a>
          </div>
        )}

        {!status?.configured && !isLoadingStatus && (
          <div className="rounded-xl border px-3 py-3 text-sm text-cyan-50/78" style={{ borderColor: 'rgba(248, 209, 125, 0.45)', background: 'rgba(82, 56, 4, 0.28)' }}>
            Configurá `HEDERA_OPERATOR_ID`, `HEDERA_OPERATOR_KEY` y opcionalmente `HEDERA_NETWORK` para ejecutar pagos reales.
          </div>
        )}
      </div>
    </motion.section>
  )
}