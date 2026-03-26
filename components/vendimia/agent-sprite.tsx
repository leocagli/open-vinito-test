'use client';

import { motion } from 'framer-motion';
import type { Agent } from '@/lib/vendimia-types';
import { taskLabels } from '@/lib/vendimia-data';

interface AgentSpriteProps {
  agent: Agent;
  onClick?: () => void;
  isSelected?: boolean;
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
        y: [0, -4, 0]
      }}
      transition={{
        scale: { duration: 0.3 },
        y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
      }}
      whileHover={{ scale: 1.1 }}
      onClick={onClick}
    >
      {/* Task Label */}
      <motion.div 
        className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap z-20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-card/95 backdrop-blur-sm border-2 border-border rounded-lg px-3 py-1.5 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-base">{taskInfo.icon}</span>
            <span className="text-xs font-medium text-card-foreground" style={{ fontFamily: 'var(--font-vt323)' }}>
              {taskInfo.label}
            </span>
          </div>
          {/* Progress Bar */}
          <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="h-full rounded-full"
              style={{ backgroundColor: agent.color }}
              initial={{ width: 0 }}
              animate={{ width: `${agent.progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
        {/* Arrow */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-card border-r-2 border-b-2 border-border rotate-45" />
      </motion.div>

      {/* Agent Avatar */}
      <div 
        className={`
          relative w-12 h-12 rounded-lg flex items-center justify-center text-2xl
          shadow-lg transition-all duration-200
          ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
        `}
        style={{ 
          backgroundColor: agent.color,
          boxShadow: `0 4px 0 ${agent.color}88, 0 8px 16px rgba(0,0,0,0.3)`
        }}
      >
        <span className="drop-shadow-md">{agent.avatar}</span>
        
        {/* Pixel border effect */}
        <div className="absolute inset-0 rounded-lg border-2 border-white/20" />
        <div className="absolute -inset-0.5 rounded-lg border border-black/20" />
      </div>

      {/* Name tooltip on hover */}
      <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span 
          className="text-xs text-foreground bg-card/90 px-2 py-0.5 rounded whitespace-nowrap"
          style={{ fontFamily: 'var(--font-vt323)' }}
        >
          {agent.name}
        </span>
      </div>
    </motion.div>
  );
}
