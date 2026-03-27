'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GrapeIcon } from './sprites';
import { WalletButton } from '@/components/wallet/wallet-button';
import { TransactionPanelInline } from '@/components/wallet/transaction-panel';

interface TopBarProps {
  season: string;
  day: number;
  totalGrapes: number;
  currentScene?: string;
  onSceneChange?: (scene: string) => void;
}

const SCENES = ['plaza-central', 'vinedo', 'fermentacion', 'oficina'] as const;
const SCENE_LABELS: Record<string, string> = {
  'plaza-central': '🏛️ Plaza',
  'vinedo': '🍇 Viñedo',
  'fermentacion': '🛢️ Fermentación',
  'oficina': '📋 Oficina'
};

export function TopBar({ season, day, totalGrapes, currentScene = 'plaza-central', onSceneChange }: TopBarProps) {
  const [showTransactions, setShowTransactions] = useState(false);

  return (
    <>
      {/* Left side - Game info */}
      <motion.div
        className="absolute top-0 left-0 z-10 pointer-events-none"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="p-2 md:p-3">
        {/* Logo - Pixel style */}
        <div 
          className="px-3 py-2 pointer-events-auto flex items-center gap-2"
          style={{
            backgroundColor: '#8b2942',
            border: '3px solid #5c1a2a',
            boxShadow: '3px 3px 0 rgba(0,0,0,0.3)'
          }}
        >
          <GrapeIcon size={20} />
          <span 
            className="text-xs md:text-sm font-bold tracking-wider"
            style={{ 
              fontFamily: 'var(--font-vt323)',
              color: '#ffd700',
              letterSpacing: '1px'
            }}
          >
            VENDIMIA WORLD
          </span>
        </div>

        {/* Stats row */}
        <div className="flex gap-1 mt-1">
          {/* Day counter */}
          <div 
            className="px-2 py-1 pointer-events-auto flex items-center gap-1"
            style={{
              backgroundColor: '#f5f0e1',
              border: '2px solid #4a3728',
              boxShadow: '2px 2px 0 rgba(0,0,0,0.2)'
            }}
          >
            <span className="text-sm">📅</span>
            <span 
              className="text-xs"
              style={{ fontFamily: 'var(--font-vt323)', color: '#4a3728' }}
            >
              Dia {day}
            </span>
          </div>

          {/* Grapes counter */}
          <div 
            className="px-2 py-1 pointer-events-auto flex items-center gap-1"
            style={{
              backgroundColor: '#f5f0e1',
              border: '2px solid #4a3728',
              boxShadow: '2px 2px 0 rgba(0,0,0,0.2)'
            }}
          >
            <GrapeIcon size={14} />
            <span 
              className="text-xs font-bold"
              style={{ fontFamily: 'var(--font-vt323)', color: '#7c3aed' }}
            >
              {totalGrapes.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </span>
          </div>
        </div>

        {/* Season indicator - hidden on small screens */}
        <div 
          className="hidden sm:flex px-2 py-1 mt-1 pointer-events-auto items-center gap-1"
          style={{
            backgroundColor: '#f5f0e1',
            border: '2px solid #4a3728',
            boxShadow: '2px 2px 0 rgba(0,0,0,0.2)'
          }}
        >
          <span className="text-sm">🌞</span>
          <span 
            className="text-xs"
            style={{ fontFamily: 'var(--font-vt323)', color: '#4a3728' }}
          >
            {season}
          </span>
        </div>

        {/* Scene selector */}
        <div className="flex gap-1 mt-1 flex-wrap">
          {SCENES.map(scene => (
            <motion.button
              key={scene}
              onClick={() => onSceneChange?.(scene)}
              className="px-2 py-1 pointer-events-auto text-xs font-bold"
              style={{
                backgroundColor: currentScene === scene ? '#4a3728' : '#f5f0e1',
                color: currentScene === scene ? '#f5f0e1' : '#4a3728',
                border: '2px solid #4a3728',
                boxShadow: '2px 2px 0 rgba(0,0,0,0.2)',
                fontFamily: 'var(--font-vt323)'
              }}
              whileHover={{ y: -1 }}
              whileTap={{ y: 1 }}
            >
              {SCENE_LABELS[scene]}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>

      {/* Right side - Wallet and Transactions */}
      <motion.div
        className="absolute top-0 right-0 z-10 pointer-events-none"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="p-2 md:p-3 flex flex-col gap-2 items-end">
          <div className="flex gap-2">
            <WalletButton />
            <motion.button
              onClick={() => setShowTransactions(!showTransactions)}
              className="px-3 py-2 flex items-center gap-2 pointer-events-auto"
              style={{
                backgroundColor: showTransactions ? '#2d5a27' : '#4a3728',
                border: `3px solid ${showTransactions ? '#1a3d16' : '#2d221a'}`,
                boxShadow: '3px 3px 0 rgba(0,0,0,0.3)',
                fontFamily: 'var(--font-vt323)',
                imageRendering: 'pixelated'
              }}
              whileHover={{ y: -1 }}
              whileTap={{ y: 1 }}
            >
              <PixelCoinIcon />
              <span className="text-xs font-bold text-white uppercase tracking-wide hidden sm:inline">
                TX
              </span>
            </motion.button>
          </div>
          
          {/* Inline Transaction Panel */}
          <AnimatePresence>
            {showTransactions && (
              <TransactionPanelInline />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
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
  );
}
