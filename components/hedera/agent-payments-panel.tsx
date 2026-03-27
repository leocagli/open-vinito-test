'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

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

interface AgentPaymentsPanelProps {
  docked?: boolean
}

export function AgentPaymentsPanel({ docked = false }: AgentPaymentsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
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
    <div className={docked ? 'relative pointer-events-auto' : undefined}>
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        className={docked ? 'px-2 py-1.5 flex h-10 min-w-[7.5rem] items-center justify-center gap-1.5' : 'fixed top-52 left-4 md:top-[8.75rem] md:left-[21rem] z-50 px-3 py-2 flex items-center gap-2'}
        style={{
          backgroundColor: 'rgba(74, 55, 40, 0.78)',
          border: '3px solid #2d221a',
          boxShadow: '3px 3px 0 rgba(0,0,0,0.3)',
          fontFamily: 'var(--font-vt323)',
          imageRendering: 'pixelated',
          backdropFilter: 'blur(4px)',
        }}
        whileHover={{ y: -1 }}
        whileTap={{ y: 1 }}
      >
        <span className={`${docked ? 'text-[10px]' : 'text-xs'} font-bold text-white uppercase tracking-wider`}>
          {isOpen ? 'Cerrar Hedera' : 'Hedera Pagos'}
        </span>
        <span
          className={`${docked ? 'text-[9px] px-1.5' : 'text-[10px] px-2'} font-bold uppercase py-0.5`}
          style={{
            backgroundColor: status?.configured ? '#2d5a27' : '#8b2942',
            border: '2px solid #2d221a',
            color: '#fff',
            fontFamily: 'var(--font-vt323)',
          }}
        >
          {isLoadingStatus ? '...' : status?.configured ? `${status.network}` : 'env'}
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.section
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className={docked ? 'absolute left-0 top-[calc(100%+0.75rem)] z-[110] w-[min(22rem,calc(100vw-2rem))] max-h-[68vh] overflow-hidden' : 'fixed top-64 left-4 md:top-[11.75rem] md:left-[21rem] z-40 w-[calc(100vw-2rem)] max-w-72 max-h-[68vh] overflow-hidden'}
            style={{
              backgroundColor: '#f5e6d3',
              border: '4px solid #4a3728',
              boxShadow: '4px 4px 0 rgba(0,0,0,0.4)',
              imageRendering: 'pixelated',
            }}
          >
            <div
              className="px-3 py-2"
              style={{
                backgroundColor: '#4a3728',
                borderBottom: '2px solid #2d221a',
              }}
            >
              <span className="text-xs font-bold uppercase tracking-wider text-[#ffd700]" style={{ fontFamily: 'var(--font-vt323)' }}>
                Hedera Agentic Payments
              </span>
              <p className="mt-1 text-[11px] text-[#f5e6d3]" style={{ fontFamily: 'var(--font-vt323)' }}>
                Flujo de pagos HBAR para agentes IA con memo verificable.
              </p>
            </div>

            <div className="p-3 space-y-3 overflow-y-auto max-h-[calc(68vh-3rem)]">
              <div
                className="p-2 text-[11px]"
                style={{
                  backgroundColor: '#fff',
                  border: '2px solid #4a3728',
                  color: '#4a3728',
                  fontFamily: 'var(--font-vt323)',
                }}
              >
                <p className="uppercase">Estado: {isLoadingStatus ? 'loading' : status?.configured ? 'ready' : 'env missing'}</p>
                <p>Red: {status?.network || 'testnet'}</p>
                {status?.operatorId && <p>Operator: {status.operatorId}</p>}
              </div>

              <form onSubmit={handleSubmit} className="space-y-2">
                <label className="block">
                  <span className="block text-[11px] mb-1 uppercase" style={{ fontFamily: 'var(--font-vt323)', color: '#4a3728' }}>
                    Cuenta receptora
                  </span>
                  <input
                    value={recipientId}
                    onChange={(event) => setRecipientId(event.target.value)}
                    className="w-full px-2 py-1 text-xs"
                    style={{ backgroundColor: '#fff', border: '2px solid #4a3728', fontFamily: 'var(--font-vt323)', color: '#4a3728' }}
                    placeholder="0.0.123456"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="block text-[11px] mb-1 uppercase" style={{ fontFamily: 'var(--font-vt323)', color: '#4a3728' }}>
                      HBAR
                    </span>
                    <input
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      className="w-full px-2 py-1 text-xs"
                      style={{ backgroundColor: '#fff', border: '2px solid #4a3728', fontFamily: 'var(--font-vt323)', color: '#4a3728' }}
                      placeholder="0.1"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-[11px] mb-1 uppercase" style={{ fontFamily: 'var(--font-vt323)', color: '#4a3728' }}>
                      Service ID
                    </span>
                    <input
                      value={serviceId}
                      onChange={(event) => setServiceId(event.target.value)}
                      className="w-full px-2 py-1 text-xs"
                      style={{ backgroundColor: '#fff', border: '2px solid #4a3728', fontFamily: 'var(--font-vt323)', color: '#4a3728' }}
                      placeholder="vendimia-agent"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="block text-[11px] mb-1 uppercase" style={{ fontFamily: 'var(--font-vt323)', color: '#4a3728' }}>
                    Objetivo del agente
                  </span>
                  <textarea
                    value={agentGoal}
                    onChange={(event) => setAgentGoal(event.target.value)}
                    rows={3}
                    className="w-full px-2 py-1 text-xs"
                    style={{ backgroundColor: '#fff', border: '2px solid #4a3728', fontFamily: 'var(--font-vt323)', color: '#4a3728' }}
                    placeholder="settlement for verified delivery milestone"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting || !status?.configured}
                  className="w-full py-2 px-3 text-xs font-bold uppercase"
                  style={{
                    backgroundColor: !isSubmitting && status?.configured ? '#2d5a27' : '#ccc',
                    border: `2px solid ${!isSubmitting && status?.configured ? '#1a3d16' : '#999'}`,
                    color: !isSubmitting && status?.configured ? '#fff' : '#666',
                    fontFamily: 'var(--font-vt323)',
                    cursor: !isSubmitting && status?.configured ? 'pointer' : 'not-allowed',
                    boxShadow: !isSubmitting && status?.configured ? '2px 2px 0 rgba(0,0,0,0.2)' : 'none',
                  }}
                >
                  {isSubmitting ? 'Enviando...' : 'Disparar pago Hedera'}
                </button>
              </form>

              {error && (
                <div className="p-2 text-xs" style={{ backgroundColor: '#ffe3bf', border: '2px solid #8b2942', color: '#8b2942', fontFamily: 'var(--font-vt323)' }}>
                  {error}
                </div>
              )}

              {result && (
                <div className="p-2 text-xs space-y-1" style={{ backgroundColor: '#eef7ee', border: '2px solid #2d5a27', color: '#2d5a27', fontFamily: 'var(--font-vt323)' }}>
                  <p className="uppercase">Pago confirmado</p>
                  <p>Tx ID: {result.transactionId}</p>
                  <p>Estado: {result.receiptStatus}</p>
                  <p>Memo: {result.memo}</p>
                  <p>Destino: {result.recipientId}</p>
                  <a href={result.explorerUrl} target="_blank" rel="noreferrer" className="inline-block underline underline-offset-2">
                    Ver en HashScan
                  </a>
                </div>
              )}

              {!status?.configured && !isLoadingStatus && (
                <div className="p-2 text-xs" style={{ backgroundColor: '#fff2d9', border: '2px solid #9a6f1a', color: '#7a5a19', fontFamily: 'var(--font-vt323)' }}>
                  Configura HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY y opcionalmente HEDERA_NETWORK para pagos reales.
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}