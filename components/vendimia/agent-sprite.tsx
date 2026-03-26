'use client';

import { motion } from 'framer-motion';
import type { Agent } from '@/lib/vendimia-types';
import { taskLabels } from '@/lib/vendimia-data';

interface AgentSpriteProps {
  agent: Agent;
  onClick?: () => void;
  isSelected?: boolean;
}

// Pixel art style task icons using CSS
function TaskIcon({ task }: { task: string }) {
  const iconStyles: Record<string, { bg: string; icon: string }> = {
    cosecha: { bg: '#8b5cf6', icon: '🍇' },
    riego: { bg: '#3b82f6', icon: '💧' },
    poda: { bg: '#f59e0b', icon: '✂️' },
    fermentacion: { bg: '#ef4444', icon: '🧪' },
    embotellado: { bg: '#10b981', icon: '🍾' },
    cata: { bg: '#ec4899', icon: '🍷' },
  };
  
  const style = iconStyles[task] || iconStyles.cosecha;
  
  return (
    <div 
      className="w-5 h-5 flex items-center justify-center text-xs"
      style={{ 
        backgroundColor: style.bg,
        boxShadow: `2px 2px 0 rgba(0,0,0,0.3)`,
        imageRendering: 'pixelated'
      }}
    >
      {style.icon}
    </div>
  );
}

export function AgentSprite({ agent, onClick, isSelected }: AgentSpriteProps) {
  const taskInfo = taskLabels[agent.task];
  
  return (
    <motion.div
      className="absolute cursor-pointer group"
      style={{ 
        left: `${agent.x}%`, 
        top: `${agent.y}%`,
        transform: 'translate(-50%, -50%)'
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        y: [0, -3, 0]
      }}
      transition={{
        scale: { duration: 0.3 },
        y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
      }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
    >
      {/* Task Label - Pixel art style bubble */}
      <motion.div 
        className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap z-20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div 
          className="relative px-2 py-1"
          style={{
            backgroundColor: '#f5f0e1',
            border: '2px solid #4a3728',
            boxShadow: '3px 3px 0 rgba(0,0,0,0.25)',
            imageRendering: 'pixelated'
          }}
        >
          <div className="flex items-center gap-2">
            <TaskIcon task={agent.task} />
            <span 
              className="text-sm font-bold"
              style={{ 
                fontFamily: 'var(--font-vt323)',
                color: '#4a3728',
                letterSpacing: '0.5px'
              }}
            >
              {taskInfo.label}
            </span>
          </div>
          {/* Progress Bar - Pixel style */}
          <div 
            className="mt-1.5 h-3 overflow-hidden"
            style={{
              backgroundColor: '#d4c9b5',
              border: '1px solid #8b7355'
            }}
          >
            <motion.div 
              className="h-full"
              style={{ 
                backgroundColor: '#4ade80',
                boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.2)'
              }}
              initial={{ width: 0 }}
              animate={{ width: `${agent.progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
        {/* Pixel arrow pointing down */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0"
          style={{
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #4a3728'
          }}
        />
      </motion.div>

      {/* Agent Avatar - Pixel art style */}
      <div 
        className={`
          relative w-10 h-12 flex flex-col items-center justify-end
          ${isSelected ? 'brightness-110' : ''}
        `}
      >
        {/* Head */}
        <div 
          className="w-8 h-8 relative"
          style={{
            backgroundColor: agent.skinColor || '#e8c39e',
            border: '2px solid #4a3728',
            boxShadow: '2px 2px 0 rgba(0,0,0,0.2)'
          }}
        >
          {/* Hair */}
          <div 
            className="absolute -top-1 left-0 right-0 h-2"
            style={{ backgroundColor: agent.hairColor || '#5c4033' }}
          />
          {/* Eyes */}
          <div className="absolute top-3 left-1 w-1.5 h-1.5 bg-black" />
          <div className="absolute top-3 right-1 w-1.5 h-1.5 bg-black" />
        </div>
        
        {/* Body */}
        <div 
          className="w-10 h-6 -mt-1"
          style={{
            backgroundColor: agent.shirtColor || '#6366f1',
            border: '2px solid #4a3728',
            borderTop: 'none',
            boxShadow: '2px 2px 0 rgba(0,0,0,0.2)'
          }}
        />
        
        {/* Selection ring */}
        {isSelected && (
          <motion.div
            className="absolute -inset-1 border-2 border-primary"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{ boxShadow: '0 0 8px rgba(139, 92, 246, 0.5)' }}
          />
        )}
      </div>

      {/* Name tooltip on hover */}
      <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span 
          className="text-sm px-2 py-0.5 whitespace-nowrap"
          style={{ 
            fontFamily: 'var(--font-vt323)',
            backgroundColor: '#4a3728',
            color: '#f5f0e1',
            boxShadow: '2px 2px 0 rgba(0,0,0,0.3)'
          }}
        >
          {agent.name}
        </span>
      </div>
    </motion.div>
  );
}
