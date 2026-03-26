'use client';

import { motion } from 'framer-motion';

interface TopBarProps {
  season: string;
  day: number;
  totalGrapes: number;
}

export function TopBar({ season, day, totalGrapes }: TopBarProps) {
  return (
    <motion.div
      className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center justify-between p-2 md:p-4">
        {/* Logo */}
        <div className="bg-primary/90 backdrop-blur-sm px-3 py-2 md:px-4 md:py-2 rounded-lg border-2 border-primary shadow-lg pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="text-xl md:text-2xl">🍇</span>
            <span 
              className="text-xs md:text-sm font-bold text-primary-foreground tracking-wider"
              style={{ fontFamily: 'var(--font-pixel)' }}
            >
              VENDIMIA WORLD
            </span>
          </div>
        </div>

        {/* Stats - Hidden on very small screens */}
        <div className="hidden sm:flex items-center gap-2 md:gap-4">
          {/* Season */}
          <motion.div 
            className="bg-card/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-border shadow-lg pointer-events-auto"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-2">
              <span>🌞</span>
              <span 
                className="text-xs md:text-sm text-card-foreground"
                style={{ fontFamily: 'var(--font-vt323)' }}
              >
                {season}
              </span>
            </div>
          </motion.div>

          {/* Day */}
          <motion.div 
            className="bg-card/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-border shadow-lg pointer-events-auto"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span 
                className="text-xs md:text-sm text-card-foreground"
                style={{ fontFamily: 'var(--font-vt323)' }}
              >
                Día {day}
              </span>
            </div>
          </motion.div>

          {/* Grapes collected */}
          <motion.div 
            className="bg-accent/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-accent shadow-lg pointer-events-auto"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-2">
              <span>🍇</span>
              <span 
                className="text-xs md:text-sm font-bold text-accent-foreground"
                style={{ fontFamily: 'var(--font-vt323)' }}
              >
                {totalGrapes.toLocaleString()} kg
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
