'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useChainId, useConnect, usePublicClient, useSendTransaction, useSwitchChain, useWriteContract } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';
import { connectFreighter, getFreighterNetwork, getFreighterPublicKey, isFreighterInstalled, sendStellarPayment, signTransaction } from '@/lib/stellar-utils';
import { clearWalletConnectSessionStorage, isWalletConnectResetError } from '@/lib/walletconnect-utils';
import { ESCROW_MILESTONE_ABI, X402_SERVICE_PAYWALL_ABI } from '@/lib/bnb-contracts';
import { isAddress, keccak256, parseEther, stringToHex } from 'viem';

interface TransactionLog {
  id: string;
  type: 'bnb' | 'stellar';
  status: 'pending' | 'success' | 'error';
  message: string;
  txHash?: string;
  timestamp: number;
}

interface TransactionPanelProps {
  docked?: boolean;
}

export function TransactionPanel({ docked = false }: TransactionPanelProps) {
  const { address, isConnected } = useAccount();
  const bnbChainId = useChainId();
  const bnbPublicClient = usePublicClient({ chainId: bscTestnet.id });
  const { sendTransactionAsync, isPending: isSendingBnb } = useSendTransaction();
  const { connectAsync, connectors, isPending: isConnectingBnb } = useConnect();
  const { writeContractAsync, isPending: isWritingContract } = useWriteContract();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'bnb' | 'stellar'>('bnb');
  const [txLogs, setTxLogs] = useState<TransactionLog[]>([]);
  const [bnbAmount, setBnbAmount] = useState('0.01');
  const [bnbRecipient, setBnbRecipient] = useState('');
  const [stellarAmount, setStellarAmount] = useState('10');
  const [stellarRecipient, setStellarRecipient] = useState('');
  const [escrowAmount, setEscrowAmount] = useState('0.005');
  const [escrowDeadlineHours, setEscrowDeadlineHours] = useState('24');
  const [escrowMetadata, setEscrowMetadata] = useState('vendimia-deal');
  const [x402Amount, setX402Amount] = useState('0.001');
  const [x402Ref, setX402Ref] = useState('vendimia-service-demo');
  const [stellarDealId, setStellarDealId] = useState('1');
  const [stellarEscrowAmount, setStellarEscrowAmount] = useState('10');
  const [stellarEscrowMetadata, setStellarEscrowMetadata] = useState('vendimia-soroban');
  const [stellarReputationDelta, setStellarReputationDelta] = useState('10');
  const [isSendingStellar, setIsSendingStellar] = useState(false);
  const [isConnectingStellar, setIsConnectingStellar] = useState(false);
  const [isSendingStellarContract, setIsSendingStellarContract] = useState(false);
  const bnbTestnetReady = isConnected && bnbChainId === bscTestnet.id;
  const bnbDefaultRecipient = address || '';
  const bnbEscrowContract = process.env.NEXT_PUBLIC_BNB_ESCROW_CONTRACT;
  const bnbX402Contract = process.env.NEXT_PUBLIC_BNB_X402_CONTRACT;
  const stellarEscrowContract = process.env.NEXT_PUBLIC_STELLAR_ESCROW_CONTRACT_ID;
  const stellarReputationContract = process.env.NEXT_PUBLIC_STELLAR_REPUTATION_CONTRACT_ID;

  const addLog = (log: Omit<TransactionLog, 'id' | 'timestamp'>) => {
    setTxLogs((prev) => [
      {
        ...log,
        id: Date.now().toString(),
        timestamp: Date.now(),
      },
      ...prev.slice(0, 4), // Keep only last 5 logs
    ]);
  };

  const metaMaskConnector = connectors.find((connector) => connector.id === 'injected');
  const walletConnectConnector = connectors.find((connector) => connector.id === 'walletConnect');

  const openBnbWalletModal = async (kind: 'metamask' | 'walletconnect' = 'metamask') => {
    try {
      const connector = kind === 'walletconnect' ? walletConnectConnector : metaMaskConnector;
      if (!connector) {
        addLog({
          type: 'bnb',
          status: 'error',
          message: `${kind} no disponible`,
        });
        return;
      }

      await connectAsync({ connector });
    } catch (error) {
      if (kind === 'walletconnect' && isWalletConnectResetError(error)) {
        clearWalletConnectSessionStorage();
      }
      const message = error instanceof Error ? error.message : 'No se pudo conectar MetaMask';
      addLog({
        type: 'bnb',
        status: 'error',
        message: message.slice(0, 80),
      });
    }
  };

  const handleConnectStellar = async () => {
    setIsConnectingStellar(true);
    try {
      const { error } = await connectFreighter();
      if (error) {
        addLog({
          type: 'stellar',
          status: 'error',
          message: error.slice(0, 80),
        });
      }
    } finally {
      setIsConnectingStellar(false);
    }
  };

  const handleBNBTransaction = async () => {
    if (!isConnected || !address) {
      await openBnbWalletModal('metamask');
      return;
    }

    if (bnbChainId !== bscTestnet.id) {
      addLog({
        type: 'bnb',
        status: 'error',
        message: 'Cambia a BNB Testnet (chain 97)',
      });
      return;
    }

    const recipient = (bnbRecipient || bnbDefaultRecipient).trim();
    if (!isAddress(recipient)) {
      addLog({
        type: 'bnb',
        status: 'error',
        message: 'Direccion BNB invalida',
      });
      return;
    }

    const amountNum = Number(bnbAmount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      addLog({
        type: 'bnb',
        status: 'error',
        message: 'Monto BNB invalido',
      });
      return;
    }

    addLog({
      type: 'bnb',
      status: 'pending',
      message: `Enviando ${bnbAmount} BNB...`,
    });

    try {
      const txHash = await sendTransactionAsync({
        to: recipient as `0x${string}`,
        value: parseEther(bnbAmount),
        chainId: bscTestnet.id,
      });

      if (bnbPublicClient) {
        await bnbPublicClient.waitForTransactionReceipt({ hash: txHash });
      }

      addLog({
        type: 'bnb',
        status: 'success',
        message: `${bnbAmount} BNB enviados`,
        txHash,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error enviando BNB';
      addLog({
        type: 'bnb',
        status: 'error',
        message: message.slice(0, 80),
      });
    }
  };

  const handleStellarTransaction = async () => {
    const installed = await isFreighterInstalled();
    if (!installed) {
      addLog({
        type: 'stellar',
        status: 'error',
        message: 'Freighter no instalado',
      });
      return;
    }

    try {
      const publicKey = await getFreighterPublicKey();
      if (!publicKey) {
        await handleConnectStellar();
        return;
      }

      const network = await getFreighterNetwork();
      if (network !== 'TESTNET') {
        addLog({
          type: 'stellar',
          status: 'error',
          message: 'Cambia Freighter a TESTNET',
        });
        return;
      }

      const destination = (stellarRecipient || publicKey).trim();
      if (!destination) {
        addLog({
          type: 'stellar',
          status: 'error',
          message: 'Direccion Stellar requerida',
        });
        return;
      }

      const amountNum = Number(stellarAmount);
      if (!Number.isFinite(amountNum) || amountNum <= 0) {
        addLog({
          type: 'stellar',
          status: 'error',
          message: 'Monto XLM invalido',
        });
        return;
      }

      addLog({
        type: 'stellar',
        status: 'pending',
        message: `Enviando ${stellarAmount} XLM...`,
      });

      setIsSendingStellar(true);
      const { txHash, error } = await sendStellarPayment({
        sourcePublicKey: publicKey,
        destinationPublicKey: destination,
        amount: stellarAmount,
        network: 'TESTNET',
      });

      if (error || !txHash) {
        addLog({
          type: 'stellar',
          status: 'error',
          message: (error || 'Error enviando XLM').slice(0, 80),
        });
        return;
      }

        addLog({
          type: 'stellar',
          status: 'success',
          message: `${stellarAmount} XLM enviados`,
          txHash,
        });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error de conexion'
      addLog({
        type: 'stellar',
        status: 'error',
        message: message.slice(0, 80),
      });
    } finally {
      setIsSendingStellar(false);
    }
  };

  const handleBnbEscrowCreate = async () => {
    if (!isConnected || !address) {
      addLog({ type: 'bnb', status: 'error', message: 'Conecta wallet BNB primero' });
      return;
    }
    if (bnbChainId !== bscTestnet.id) {
      addLog({ type: 'bnb', status: 'error', message: 'Usa BNB Testnet (97)' });
      return;
    }
    if (!bnbEscrowContract || !isAddress(bnbEscrowContract)) {
      addLog({ type: 'bnb', status: 'error', message: 'Configura NEXT_PUBLIC_BNB_ESCROW_CONTRACT' });
      return;
    }

    const payee = (bnbRecipient || bnbDefaultRecipient).trim();
    if (!isAddress(payee)) {
      addLog({ type: 'bnb', status: 'error', message: 'Payee EVM invalido' });
      return;
    }

    const deadlineHours = Number(escrowDeadlineHours);
    if (!Number.isFinite(deadlineHours) || deadlineHours <= 0) {
      addLog({ type: 'bnb', status: 'error', message: 'Deadline invalido' });
      return;
    }

    try {
      addLog({ type: 'bnb', status: 'pending', message: 'Creando escrow EVM...' });

      const deadline = Math.floor(Date.now() / 1000 + deadlineHours * 3600);
      const txHash = await writeContractAsync({
        address: bnbEscrowContract as `0x${string}`,
        abi: ESCROW_MILESTONE_ABI,
        functionName: 'createDeal',
        args: [payee as `0x${string}`, BigInt(deadline), escrowMetadata || 'vendimia-deal'],
        value: parseEther(escrowAmount),
        chainId: bscTestnet.id,
      });

      if (bnbPublicClient) {
        await bnbPublicClient.waitForTransactionReceipt({ hash: txHash });
      }

      addLog({ type: 'bnb', status: 'success', message: 'Escrow EVM creado', txHash });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creando escrow EVM';
      addLog({ type: 'bnb', status: 'error', message: message.slice(0, 80) });
    }
  };

  const handleBnbX402Settle = async () => {
    if (!isConnected || !address) {
      addLog({ type: 'bnb', status: 'error', message: 'Conecta wallet BNB primero' });
      return;
    }
    if (bnbChainId !== bscTestnet.id) {
      addLog({ type: 'bnb', status: 'error', message: 'Usa BNB Testnet (97)' });
      return;
    }
    if (!bnbX402Contract || !isAddress(bnbX402Contract)) {
      addLog({ type: 'bnb', status: 'error', message: 'Configura NEXT_PUBLIC_BNB_X402_CONTRACT' });
      return;
    }
    if (!x402Ref.trim()) {
      addLog({ type: 'bnb', status: 'error', message: 'Referencia x402 requerida' });
      return;
    }

    try {
      addLog({ type: 'bnb', status: 'pending', message: 'Ejecutando settle402...' });
      const refHash = keccak256(stringToHex(x402Ref));
      const txHash = await writeContractAsync({
        address: bnbX402Contract as `0x${string}`,
        abi: X402_SERVICE_PAYWALL_ABI,
        functionName: 'settle402',
        args: [refHash],
        value: parseEther(x402Amount),
        chainId: bscTestnet.id,
      });

      if (bnbPublicClient) {
        await bnbPublicClient.waitForTransactionReceipt({ hash: txHash });
      }

      addLog({ type: 'bnb', status: 'success', message: 'x402 settle ejecutado', txHash });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error en settle402';
      addLog({ type: 'bnb', status: 'error', message: message.slice(0, 80) });
    }
  };

  const invokeStellarContract = async (params: {
    contractId: string;
    method: string;
    args: Array<{ type: 'u64' | 'i128' | 'i32' | 'address' | 'string'; value: string | number }>;
    successMsg: string;
  }) => {
    const installed = await isFreighterInstalled();
    if (!installed) {
      addLog({ type: 'stellar', status: 'error', message: 'Freighter no instalado' });
      return;
    }

    const source = await getFreighterPublicKey();
    if (!source) {
      await handleConnectStellar();
      return;
    }

    const network = await getFreighterNetwork();
    if (network !== 'TESTNET') {
      addLog({ type: 'stellar', status: 'error', message: 'Cambia Freighter a TESTNET' });
      return;
    }

    setIsSendingStellarContract(true);
    try {
      addLog({ type: 'stellar', status: 'pending', message: `Invocando ${params.method}...` });

      const buildRes = await fetch('/api/stellar/build-contract-tx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourcePublic: source,
          contractId: params.contractId,
          method: params.method,
          args: params.args,
        }),
      });
      const buildData = await buildRes.json();
      if (!buildRes.ok || !buildData?.xdr) {
        throw new Error(buildData?.error || 'No se pudo construir tx Soroban');
      }

      const signed = await signTransaction(buildData.xdr, 'TESTNET');
      if (signed.error || !signed.signedXdr) {
        throw new Error(signed.error || 'Firma rechazada');
      }

      const submitRes = await fetch('/api/stellar/submit-tx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedXdr: signed.signedXdr }),
      });
      const submitData = await submitRes.json();
      if (!submitRes.ok || !submitData?.success) {
        throw new Error(submitData?.error || 'No se pudo enviar tx Soroban');
      }

      addLog({ type: 'stellar', status: 'success', message: params.successMsg, txHash: submitData.hash });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error Soroban';
      addLog({ type: 'stellar', status: 'error', message: message.slice(0, 80) });
    } finally {
      setIsSendingStellarContract(false);
    }
  };

  const handleStellarEscrowCreate = async () => {
    if (!stellarEscrowContract) {
      addLog({ type: 'stellar', status: 'error', message: 'Configura NEXT_PUBLIC_STELLAR_ESCROW_CONTRACT_ID' });
      return;
    }
    const destination = (stellarRecipient || '').trim();
    if (!destination) {
      addLog({ type: 'stellar', status: 'error', message: 'Destino Stellar requerido' });
      return;
    }

    await invokeStellarContract({
      contractId: stellarEscrowContract,
      method: 'create',
      args: [
        { type: 'u64', value: Number(stellarDealId) || 1 },
        { type: 'address', value: 'SOURCE' },
        { type: 'address', value: destination },
        { type: 'i128', value: Number(stellarEscrowAmount) || 1 },
        { type: 'string', value: stellarEscrowMetadata || 'vendimia-soroban' },
      ],
      successMsg: 'Escrow Soroban creado',
    });
  };

  const handleStellarReputationDelta = async () => {
    if (!stellarReputationContract) {
      addLog({ type: 'stellar', status: 'error', message: 'Configura NEXT_PUBLIC_STELLAR_REPUTATION_CONTRACT_ID' });
      return;
    }

    const actor = (stellarRecipient || '').trim();
    if (!actor) {
      addLog({ type: 'stellar', status: 'error', message: 'Actor Stellar requerido' });
      return;
    }

    await invokeStellarContract({
      contractId: stellarReputationContract,
      method: 'apply_delta',
      args: [
        { type: 'address', value: actor },
        { type: 'i32', value: Number(stellarReputationDelta) || 0 },
      ],
      successMsg: 'Reputacion Soroban actualizada',
    });
  };

  return (
    <div className={docked ? 'relative pointer-events-auto' : undefined}>
      {/* Toggle button - pixel style */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={docked ? 'px-2 py-1.5 flex h-10 min-w-[7.5rem] items-center justify-center gap-1.5' : 'fixed top-40 left-4 md:top-[8.75rem] md:left-[10.5rem] z-50 px-3 py-2 flex items-center gap-2'}
        style={{
          backgroundColor: 'rgba(74, 55, 40, 0.78)',
          border: '3px solid #2d221a',
          boxShadow: '3px 3px 0 rgba(0,0,0,0.3)',
          fontFamily: 'var(--font-vt323)',
          imageRendering: 'pixelated',
          backdropFilter: 'blur(4px)'
        }}
        whileHover={{ y: -1 }}
        whileTap={{ y: 1 }}
      >
        <PixelCoinIcon />
        <span className={`${docked ? 'text-[10px]' : 'text-xs'} font-bold text-white uppercase`}>
          {isOpen ? 'Cerrar' : 'Transacciones'}
        </span>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className={docked ? 'absolute left-0 top-[calc(100%+0.75rem)] z-[110] w-[min(22rem,calc(100vw-2rem))]' : 'fixed top-52 left-4 md:top-[11.75rem] md:left-[10.5rem] z-40 w-[calc(100vw-2rem)] max-w-72'}
            style={{
              backgroundColor: '#f5e6d3',
              border: '4px solid #4a3728',
              boxShadow: '4px 4px 0 rgba(0,0,0,0.4)',
              imageRendering: 'pixelated'
            }}
          >
            {/* Header */}
            <div 
              className="px-3 py-2"
              style={{ 
                backgroundColor: '#4a3728',
                borderBottom: '2px solid #2d221a'
              }}
            >
              <span 
                className="text-xs font-bold uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-vt323)', color: '#ffd700' }}
              >
                Panel de Transacciones
              </span>
            </div>

            {/* Tabs */}
            <div className="flex" style={{ borderBottom: '2px solid #4a3728' }}>
              <button
                onClick={() => setActiveTab('bnb')}
                className="flex-1 py-2 px-3 text-xs font-bold uppercase"
                style={{ 
                  backgroundColor: activeTab === 'bnb' ? '#f0b90b' : '#e8d5c4',
                  color: activeTab === 'bnb' ? '#1e2026' : '#4a3728',
                  fontFamily: 'var(--font-vt323)',
                  borderRight: '2px solid #4a3728'
                }}
              >
                BNB
              </button>
              <button
                onClick={() => setActiveTab('stellar')}
                className="flex-1 py-2 px-3 text-xs font-bold uppercase"
                style={{ 
                  backgroundColor: activeTab === 'stellar' ? '#222' : '#e8d5c4',
                  color: activeTab === 'stellar' ? '#fff' : '#4a3728',
                  fontFamily: 'var(--font-vt323)'
                }}
              >
                Stellar
              </button>
            </div>

            {/* Content */}
            <div className="p-3 space-y-3">
              {activeTab === 'bnb' && (
                <>
                  <div>
                    <label 
                      className="block text-xs font-bold mb-1"
                      style={{ fontFamily: 'var(--font-vt323)', color: '#4a3728' }}
                    >
                      Destino BNB
                    </label>
                    <input
                      type="text"
                      value={bnbRecipient}
                      onChange={(e) => setBnbRecipient(e.target.value)}
                      placeholder={bnbDefaultRecipient || '0x...'}
                      className="w-full px-2 py-1 text-xs mb-2"
                      style={{
                        backgroundColor: '#fff',
                        border: '2px solid #4a3728',
                        fontFamily: 'var(--font-vt323)',
                        color: '#4a3728'
                      }}
                      disabled={!isConnected || isSendingBnb}
                    />

                    <label 
                      className="block text-xs font-bold mb-1"
                      style={{ fontFamily: 'var(--font-vt323)', color: '#4a3728' }}
                    >
                      Cantidad BNB
                    </label>
                    <input
                      type="number"
                      value={bnbAmount}
                      onChange={(e) => setBnbAmount(e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-full px-2 py-1 text-xs"
                      style={{
                        backgroundColor: '#fff',
                        border: '2px solid #4a3728',
                        fontFamily: 'var(--font-vt323)',
                        color: '#4a3728'
                      }}
                      disabled={!isConnected || isSendingBnb}
                    />
                  </div>
                  {!isConnected ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => openBnbWalletModal('metamask')}
                        disabled={isSendingBnb || isConnectingBnb || !metaMaskConnector}
                        className="w-full py-2 px-3 text-xs font-bold uppercase"
                        style={{ 
                          backgroundColor: !isSendingBnb && metaMaskConnector ? '#f0b90b' : '#ccc',
                          border: `2px solid ${!isSendingBnb && metaMaskConnector ? '#c99b09' : '#999'}`,
                          color: !isSendingBnb && metaMaskConnector ? '#1e2026' : '#666',
                          fontFamily: 'var(--font-vt323)',
                          cursor: !isSendingBnb && metaMaskConnector ? 'pointer' : 'not-allowed',
                          boxShadow: !isSendingBnb && metaMaskConnector ? '2px 2px 0 rgba(0,0,0,0.2)' : 'none'
                        }}
                      >
                        MetaMask
                      </button>

                      <button
                        onClick={() => openBnbWalletModal('walletconnect')}
                        disabled={isSendingBnb || isConnectingBnb || !walletConnectConnector}
                        className="w-full py-2 px-3 text-xs font-bold uppercase"
                        style={{ 
                          backgroundColor: !isSendingBnb && walletConnectConnector ? '#4a3728' : '#ccc',
                          border: `2px solid ${!isSendingBnb && walletConnectConnector ? '#2d221a' : '#999'}`,
                          color: !isSendingBnb && walletConnectConnector ? '#fff' : '#666',
                          fontFamily: 'var(--font-vt323)',
                          cursor: !isSendingBnb && walletConnectConnector ? 'pointer' : 'not-allowed',
                          boxShadow: !isSendingBnb && walletConnectConnector ? '2px 2px 0 rgba(0,0,0,0.2)' : 'none'
                        }}
                      >
                        WalletConnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleBNBTransaction}
                      disabled={isSendingBnb || isWritingContract}
                      className="w-full py-2 px-3 text-xs font-bold uppercase"
                      style={{ 
                        backgroundColor: !isSendingBnb ? '#f0b90b' : '#ccc',
                        border: `2px solid ${!isSendingBnb ? '#c99b09' : '#999'}`,
                        color: !isSendingBnb ? '#1e2026' : '#666',
                        fontFamily: 'var(--font-vt323)',
                        cursor: !isSendingBnb ? 'pointer' : 'not-allowed',
                        boxShadow: !isSendingBnb ? '2px 2px 0 rgba(0,0,0,0.2)' : 'none'
                      }}
                    >
                      {bnbChainId !== bscTestnet.id ? 'Red Incorrecta' : isSendingBnb || isConnectingBnb ? 'Confirmando...' : 'Enviar BNB'}
                    </button>
                  )}
                  <div className="mt-2 space-y-2">
                    <div
                      className="text-[10px] uppercase"
                      style={{ fontFamily: 'var(--font-vt323)', color: '#4a3728' }}
                    >
                      Smart Contracts (BNB)
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={escrowAmount}
                        onChange={(e) => setEscrowAmount(e.target.value)}
                        step="0.001"
                        min="0"
                        className="w-full px-2 py-1 text-xs"
                        style={{ backgroundColor: '#fff', border: '2px solid #4a3728', fontFamily: 'var(--font-vt323)', color: '#4a3728' }}
                        disabled={isWritingContract}
                      />
                      <input
                        type="number"
                        value={escrowDeadlineHours}
                        onChange={(e) => setEscrowDeadlineHours(e.target.value)}
                        step="1"
                        min="1"
                        className="w-full px-2 py-1 text-xs"
                        style={{ backgroundColor: '#fff', border: '2px solid #4a3728', fontFamily: 'var(--font-vt323)', color: '#4a3728' }}
                        disabled={isWritingContract}
                      />
                    </div>
                    <input
                      type="text"
                      value={escrowMetadata}
                      onChange={(e) => setEscrowMetadata(e.target.value)}
                      placeholder="metadata escrow"
                      className="w-full px-2 py-1 text-xs"
                      style={{ backgroundColor: '#fff', border: '2px solid #4a3728', fontFamily: 'var(--font-vt323)', color: '#4a3728' }}
                      disabled={isWritingContract}
                    />
                    <button
                      onClick={handleBnbEscrowCreate}
                      disabled={isWritingContract || !bnbTestnetReady}
                      className="w-full py-2 px-3 text-xs font-bold uppercase"
                      style={{
                        backgroundColor: !isWritingContract && bnbTestnetReady ? '#2d5a27' : '#ccc',
                        border: `2px solid ${!isWritingContract && bnbTestnetReady ? '#1a3d16' : '#999'}`,
                        color: !isWritingContract && bnbTestnetReady ? '#fff' : '#666',
                        fontFamily: 'var(--font-vt323)',
                        cursor: !isWritingContract && bnbTestnetReady ? 'pointer' : 'not-allowed',
                        boxShadow: !isWritingContract && bnbTestnetReady ? '2px 2px 0 rgba(0,0,0,0.2)' : 'none'
                      }}
                    >
                      {isWritingContract ? 'Procesando...' : 'Escrow createDeal'}
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={x402Ref}
                        onChange={(e) => setX402Ref(e.target.value)}
                        placeholder="x402 ref"
                        className="w-full px-2 py-1 text-xs"
                        style={{ backgroundColor: '#fff', border: '2px solid #4a3728', fontFamily: 'var(--font-vt323)', color: '#4a3728' }}
                        disabled={isWritingContract}
                      />
                      <input
                        type="number"
                        value={x402Amount}
                        onChange={(e) => setX402Amount(e.target.value)}
                        step="0.001"
                        min="0"
                        className="w-full px-2 py-1 text-xs"
                        style={{ backgroundColor: '#fff', border: '2px solid #4a3728', fontFamily: 'var(--font-vt323)', color: '#4a3728' }}
                        disabled={isWritingContract}
                      />
                    </div>
                    <button
                      onClick={handleBnbX402Settle}
                      disabled={isWritingContract || !bnbTestnetReady}
                      className="w-full py-2 px-3 text-xs font-bold uppercase"
                      style={{
                        backgroundColor: !isWritingContract && bnbTestnetReady ? '#4a3728' : '#ccc',
                        border: `2px solid ${!isWritingContract && bnbTestnetReady ? '#2d221a' : '#999'}`,
                        color: !isWritingContract && bnbTestnetReady ? '#fff' : '#666',
                        fontFamily: 'var(--font-vt323)',
                        cursor: !isWritingContract && bnbTestnetReady ? 'pointer' : 'not-allowed',
                        boxShadow: !isWritingContract && bnbTestnetReady ? '2px 2px 0 rgba(0,0,0,0.2)' : 'none'
                      }}
                    >
                      {isWritingContract ? 'Procesando...' : 'X402 settle402'}
                    </button>
                  </div>
                  {isConnected && bnbChainId !== bscTestnet.id && (
                    <div className="space-y-2">
                      <p 
                        className="text-xs"
                        style={{ fontFamily: 'var(--font-vt323)', color: '#8b2942' }}
                      >
                        Debe estar en BNB Testnet para operar.
                      </p>
                      <button
                        onClick={async () => {
                          try {
                            await switchChainAsync({ chainId: bscTestnet.id });
                          } catch {
                            addLog({ type: 'bnb', status: 'error', message: 'No se pudo cambiar de red' });
                          }
                        }}
                        disabled={isSwitchingChain}
                        className="w-full py-2 px-3 text-xs font-bold uppercase"
                        style={{ 
                          backgroundColor: !isSwitchingChain ? '#4a3728' : '#ccc',
                          border: `2px solid ${!isSwitchingChain ? '#2d221a' : '#999'}`,
                          color: !isSwitchingChain ? '#fff' : '#666',
                          fontFamily: 'var(--font-vt323)',
                          cursor: !isSwitchingChain ? 'pointer' : 'not-allowed',
                          boxShadow: !isSwitchingChain ? '2px 2px 0 rgba(0,0,0,0.2)' : 'none'
                        }}
                      >
                        {isSwitchingChain ? 'Cambiando...' : 'Cambiar a BNB Testnet'}
                      </button>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'stellar' && (
                <>
                  <div>
                    <label 
                      className="block text-xs font-bold mb-1"
                      style={{ fontFamily: 'var(--font-vt323)', color: '#4a3728' }}
                    >
                      Destino Stellar
                    </label>
                    <input
                      type="text"
                      value={stellarRecipient}
                      onChange={(e) => setStellarRecipient(e.target.value)}
                      placeholder="G..."
                      className="w-full px-2 py-1 text-xs mb-2"
                      style={{
                        backgroundColor: '#fff',
                        border: '2px solid #4a3728',
                        fontFamily: 'var(--font-vt323)',
                        color: '#4a3728'
                      }}
                      disabled={isSendingStellar}
                    />

                    <label 
                      className="block text-xs font-bold mb-1"
                      style={{ fontFamily: 'var(--font-vt323)', color: '#4a3728' }}
                    >
                      Cantidad XLM
                    </label>
                    <input
                      type="number"
                      value={stellarAmount}
                      onChange={(e) => setStellarAmount(e.target.value)}
                      step="1"
                      min="0"
                      className="w-full px-2 py-1 text-xs"
                      style={{
                        backgroundColor: '#fff',
                        border: '2px solid #4a3728',
                        fontFamily: 'var(--font-vt323)',
                        color: '#4a3728'
                      }}
                      disabled={isSendingStellar}
                    />
                  </div>
                  <button
                    onClick={handleStellarTransaction}
                    disabled={isSendingStellar || isConnectingStellar}
                    className="w-full py-2 px-3 text-xs font-bold uppercase"
                    style={{ 
                      backgroundColor: isSendingStellar || isConnectingStellar ? '#666' : '#222',
                      border: `2px solid ${isSendingStellar || isConnectingStellar ? '#555' : '#000'}`,
                      color: '#fff',
                      fontFamily: 'var(--font-vt323)',
                      boxShadow: isSendingStellar || isConnectingStellar ? 'none' : '2px 2px 0 rgba(0,0,0,0.2)',
                      cursor: isSendingStellar || isConnectingStellar ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isConnectingStellar ? 'Conectando...' : isSendingStellar ? 'Confirmando...' : 'Enviar XLM'}
                  </button>

                  <div className="mt-2 space-y-2">
                    <div
                      className="text-[10px] uppercase"
                      style={{ fontFamily: 'var(--font-vt323)', color: '#4a3728' }}
                    >
                      Smart Contracts (Stellar)
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={stellarDealId}
                        onChange={(e) => setStellarDealId(e.target.value)}
                        className="w-full px-2 py-1 text-xs"
                        style={{ backgroundColor: '#fff', border: '2px solid #4a3728', fontFamily: 'var(--font-vt323)', color: '#4a3728' }}
                        disabled={isSendingStellarContract}
                      />
                      <input
                        type="number"
                        value={stellarEscrowAmount}
                        onChange={(e) => setStellarEscrowAmount(e.target.value)}
                        className="w-full px-2 py-1 text-xs"
                        style={{ backgroundColor: '#fff', border: '2px solid #4a3728', fontFamily: 'var(--font-vt323)', color: '#4a3728' }}
                        disabled={isSendingStellarContract}
                      />
                    </div>
                    <input
                      type="text"
                      value={stellarEscrowMetadata}
                      onChange={(e) => setStellarEscrowMetadata(e.target.value)}
                      placeholder="metadata escrow soroban"
                      className="w-full px-2 py-1 text-xs"
                      style={{ backgroundColor: '#fff', border: '2px solid #4a3728', fontFamily: 'var(--font-vt323)', color: '#4a3728' }}
                      disabled={isSendingStellarContract}
                    />
                    <button
                      onClick={handleStellarEscrowCreate}
                      disabled={isSendingStellarContract}
                      className="w-full py-2 px-3 text-xs font-bold uppercase"
                      style={{
                        backgroundColor: !isSendingStellarContract ? '#2d5a27' : '#666',
                        border: `2px solid ${!isSendingStellarContract ? '#1a3d16' : '#555'}`,
                        color: '#fff',
                        fontFamily: 'var(--font-vt323)',
                        boxShadow: !isSendingStellarContract ? '2px 2px 0 rgba(0,0,0,0.2)' : 'none',
                        cursor: !isSendingStellarContract ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {isSendingStellarContract ? 'Procesando...' : 'Soroban escrow.create'}
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={stellarReputationDelta}
                        onChange={(e) => setStellarReputationDelta(e.target.value)}
                        className="w-full px-2 py-1 text-xs"
                        style={{ backgroundColor: '#fff', border: '2px solid #4a3728', fontFamily: 'var(--font-vt323)', color: '#4a3728' }}
                        disabled={isSendingStellarContract}
                      />
                      <div
                        className="px-2 py-1 text-[10px]"
                        style={{ backgroundColor: '#e8d5c4', border: '2px solid #4a3728', fontFamily: 'var(--font-vt323)', color: '#4a3728' }}
                      >
                        actor = Destino Stellar
                      </div>
                    </div>
                    <button
                      onClick={handleStellarReputationDelta}
                      disabled={isSendingStellarContract}
                      className="w-full py-2 px-3 text-xs font-bold uppercase"
                      style={{
                        backgroundColor: !isSendingStellarContract ? '#4a3728' : '#666',
                        border: `2px solid ${!isSendingStellarContract ? '#2d221a' : '#555'}`,
                        color: '#fff',
                        fontFamily: 'var(--font-vt323)',
                        boxShadow: !isSendingStellarContract ? '2px 2px 0 rgba(0,0,0,0.2)' : 'none',
                        cursor: !isSendingStellarContract ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {isSendingStellarContract ? 'Procesando...' : 'Soroban reputation.apply_delta'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Transaction logs */}
            <div 
              className="p-2 max-h-32 overflow-y-auto"
              style={{ borderTop: '2px solid #4a3728', backgroundColor: '#e8d5c4' }}
            >
              {txLogs.length === 0 ? (
                <p 
                  className="text-xs text-center py-2"
                  style={{ fontFamily: 'var(--font-vt323)', color: '#8b8b8b' }}
                >
                  Sin transacciones
                </p>
              ) : (
                <div className="space-y-1">
                  {txLogs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="p-1.5 text-xs"
                      style={{
                        backgroundColor: log.type === 'bnb' ? '#fff8e7' : '#f0f0f0',
                        borderLeft: `3px solid ${
                          log.status === 'pending' ? '#f0b90b' :
                          log.status === 'success' ? '#2d5a27' : '#8b2942'
                        }`,
                        fontFamily: 'var(--font-vt323)'
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <span 
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: 
                              log.status === 'pending' ? '#f0b90b' :
                              log.status === 'success' ? '#2d5a27' : '#8b2942'
                          }}
                        />
                        <span style={{ color: '#4a3728' }}>{log.message}</span>
                      </div>
                      {log.txHash && (
                        <p style={{ color: '#8b8b8b', fontSize: '10px' }}>
                          {log.txHash.substring(0, 12)}...
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PixelCoinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="4" y="1" width="8" height="2" fill="#ffd700" />
      <rect x="2" y="3" width="2" height="2" fill="#ffd700" />
      <rect x="12" y="3" width="2" height="2" fill="#ffd700" />
      <rect x="1" y="5" width="2" height="6" fill="#ffd700" />
      <rect x="13" y="5" width="2" height="6" fill="#ffd700" />
      <rect x="2" y="11" width="2" height="2" fill="#ffd700" />
      <rect x="12" y="11" width="2" height="2" fill="#ffd700" />
      <rect x="4" y="13" width="8" height="2" fill="#ffd700" />
      <rect x="3" y="3" width="10" height="10" fill="#c9a227" />
      <rect x="6" y="5" width="4" height="1" fill="#ffd700" />
      <rect x="7" y="6" width="2" height="4" fill="#ffd700" />
      <rect x="6" y="10" width="4" height="1" fill="#ffd700" />
    </svg>
  )
}
