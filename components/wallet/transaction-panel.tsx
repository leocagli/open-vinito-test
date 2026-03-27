'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { WalletButtonState } from './wallet-button';

interface TransactionLog {
  id: string;
  type: 'bnb' | 'stellar';
  status: 'pending' | 'success' | 'error';
  message: string;
  txHash?: string;
  timestamp: number;
}

export function TransactionPanel() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'bnb' | 'stellar'>('bnb');
  const [txLogs, setTxLogs] = useState<TransactionLog[]>([]);
  const [bnbAmount, setBnbAmount] = useState('0.01');
  const [stellarAmount, setStellarAmount] = useState('10');

  const addLog = (log: Omit<TransactionLog, 'id' | 'timestamp'>) => {
    setTxLogs((prev) => [
      {
        ...log,
        id: Date.now().toString(),
        timestamp: Date.now(),
      },
      ...prev,
    ]);
  };

  const handleBNBTransaction = async () => {
    if (!isConnected || !address) {
      addLog({
        type: 'bnb',
        status: 'error',
        message: 'Wallet no conectado',
      });
      return;
    }

    try {
      addLog({
        type: 'bnb',
        status: 'pending',
        message: `Iniciando transacción de ${bnbAmount} BNB...`,
      });

      // Simulación de transacción
      // En producción, usarías useWriteContract con tu contrato inteligente
      const mockTxHash = '0x' + Math.random().toString(16).substring(2);

      setTimeout(() => {
        addLog({
          type: 'bnb',
          status: 'success',
          message: `Transacción exitosa: ${bnbAmount} BNB`,
          txHash: mockTxHash,
        });
      }, 2000);
    } catch (error) {
      addLog({
        type: 'bnb',
        status: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      });
    }
  };

  const handleStellarTransaction = async () => {
    try {
      const freighter = (window as any).freighter;
      if (!freighter) {
        addLog({
          type: 'stellar',
          status: 'error',
          message: 'Freighter no disponible',
        });
        return;
      }

      const publicKey = await freighter.getPublicKey();
      if (!publicKey) {
        addLog({
          type: 'stellar',
          status: 'error',
          message: 'Wallet Freighter no conectado',
        });
        return;
      }

      addLog({
        type: 'stellar',
        status: 'pending',
        message: `Iniciando transacción de ${stellarAmount} XLM...`,
      });

      // Simulación de transacción Stellar
      const mockTxHash = 'txbebfae7d11ed9ebfdd00d8caa5c77bdf3cf6fe61a3d5f28ca4ae3c0e969a8c5e';

      setTimeout(() => {
        addLog({
          type: 'stellar',
          status: 'success',
          message: `Transacción exitosa: ${stellarAmount} XLM`,
          txHash: mockTxHash,
        });
      }, 2000);
    } catch (error) {
      addLog({
        type: 'stellar',
        status: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      });
    }
  };

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-50 max-w-md w-full md:w-96"
      initial={{ y: 400, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25 }}
    >
      <div
        className="bg-black border-2 border-cyan-400 rounded-lg shadow-lg shadow-cyan-400/50 overflow-hidden"
        style={{ fontFamily: 'var(--font-vt323)', fontSize: '12px' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-900 to-purple-900 p-3 border-b border-cyan-400">
          <h3 className="text-cyan-400 font-bold uppercase tracking-wider">
            Transacciones
          </h3>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-3 border-b border-cyan-400 bg-black/50">
          <button
            onClick={() => setActiveTab('bnb')}
            className={`flex-1 py-2 px-3 rounded font-bold uppercase text-xs transition-all ${
              activeTab === 'bnb'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/50'
                : 'bg-gray-700 text-cyan-400 hover:bg-gray-600'
            }`}
          >
            BNB
          </button>
          <button
            onClick={() => setActiveTab('stellar')}
            className={`flex-1 py-2 px-3 rounded font-bold uppercase text-xs transition-all ${
              activeTab === 'stellar'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50'
                : 'bg-gray-700 text-purple-300 hover:bg-gray-600'
            }`}
          >
            Stellar
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {activeTab === 'bnb' && (
            <div className="space-y-3">
              <div>
                <label className="block text-cyan-400 text-xs font-bold mb-2">
                  Cantidad BNB
                </label>
                <input
                  type="number"
                  value={bnbAmount}
                  onChange={(e) => setBnbAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  className="w-full bg-black border border-cyan-400 text-cyan-400 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  disabled={!isConnected}
                />
              </div>
              <button
                onClick={handleBNBTransaction}
                disabled={!isConnected}
                className={`w-full py-2 px-4 rounded font-bold uppercase text-xs transition-all ${
                  isConnected
                    ? 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-lg shadow-cyan-500/50 cursor-pointer'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isConnected ? 'Enviar BNB' : 'Conectar Wallet'}
              </button>
            </div>
          )}

          {activeTab === 'stellar' && (
            <div className="space-y-3">
              <div>
                <label className="block text-purple-400 text-xs font-bold mb-2">
                  Cantidad XLM
                </label>
                <input
                  type="number"
                  value={stellarAmount}
                  onChange={(e) => setStellarAmount(e.target.value)}
                  step="1"
                  min="0"
                  className="w-full bg-black border border-purple-400 text-purple-400 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                onClick={handleStellarTransaction}
                className="w-full py-2 px-4 rounded font-bold uppercase text-xs transition-all bg-purple-500 text-white hover:bg-purple-400 shadow-lg shadow-purple-500/50"
              >
                Enviar XLM
              </button>
            </div>
          )}
        </div>

        {/* Logs */}
        <div className="border-t border-cyan-400 p-3 max-h-48 overflow-y-auto bg-black/30">
          {txLogs.length === 0 ? (
            <p className="text-gray-500 text-xs">Sin transacciones aún...</p>
          ) : (
            <div className="space-y-2">
              {txLogs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className={`p-2 rounded border-l-2 text-xs ${
                    log.type === 'bnb'
                      ? 'border-cyan-500 bg-cyan-900/20'
                      : 'border-purple-500 bg-purple-900/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        log.status === 'pending'
                          ? 'bg-yellow-500 animate-pulse'
                          : log.status === 'success'
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <span className="text-gray-300">{log.message}</span>
                  </div>
                  {log.txHash && (
                    <p className="text-gray-500 mt-1 truncate">
                      Hash: {log.txHash.substring(0, 16)}...
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
