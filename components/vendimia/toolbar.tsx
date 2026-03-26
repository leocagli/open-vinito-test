'use client';

import { motion } from 'framer-motion';

interface ToolbarProps {
  onToolSelect: (tool: string) => void;
  activeTool: string | null;
}

const tools = [
  { id: 'cosecha', icon: '🍇', label: 'Cosecha' },
  { id: 'riego', icon: '💧', label: 'Riego' },
  { id: 'poda', icon: '✂️', label: 'Poda' },
  { id: 'cata', icon: '🍷', label: 'Cata' },
  { id: 'mapa', icon: '🗺️', label: 'Mapa' },
  { id: 'config', icon: '⚙️', label: 'Config' },
];

export function Toolbar({ onToolSelect, activeTool }: ToolbarProps) {
  return (
    <motion.div
      className="absolute bottom-4 right-4 z-20 hidden md:flex"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1 }}
    >
      <div className="flex gap-2 bg-card/90 backdrop-blur-md p-2 rounded-xl border-2 border-border shadow-2xl">
        {tools.map((tool, index) => (
          <motion.button
            key={tool.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1 + index * 0.1 }}
            onClick={() => onToolSelect(tool.id)}
            className={`
              w-12 h-12 rounded-lg flex items-center justify-center text-xl
              transition-all duration-200 relative group
              ${activeTool === tool.id 
                ? 'bg-primary shadow-lg scale-105' 
                : 'bg-card hover:bg-muted border border-border hover:border-primary/50'
              }
            `}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="drop-shadow">{tool.icon}</span>
            
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span 
                className="bg-card text-card-foreground text-xs px-2 py-1 rounded whitespace-nowrap border border-border shadow"
                style={{ fontFamily: 'var(--font-vt323)' }}
              >
                {tool.label}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
