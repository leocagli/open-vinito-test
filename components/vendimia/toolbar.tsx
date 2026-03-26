'use client';

import { motion } from 'framer-motion';

interface ToolbarProps {
  onToolSelect: (tool: string) => void;
  activeTool: string | null;
}

const tools = [
  { id: 'grape', icon: '🍇', label: 'Uvas' },
  { id: 'book', icon: '📕', label: 'Manual' },
  { id: 'shirt', icon: '👕', label: 'Equipar' },
  { id: 'settings', icon: '⚙️', label: 'Config' },
  { id: 'menu', icon: '☰', label: 'Menu' },
];

export function Toolbar({ onToolSelect, activeTool }: ToolbarProps) {
  return (
    <motion.div
      className="absolute bottom-4 right-4 z-20"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6 }}
    >
      <div 
        className="flex gap-1 p-1.5"
        style={{
          backgroundColor: '#3d3530',
          border: '3px solid #4a3728',
          boxShadow: '4px 4px 0 rgba(0,0,0,0.3)'
        }}
      >
        {tools.map((tool, index) => (
          <motion.button
            key={tool.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7 + index * 0.08 }}
            onClick={() => onToolSelect(tool.id)}
            className="relative group"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <div
              className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-lg md:text-xl transition-all"
              style={{
                backgroundColor: activeTool === tool.id ? '#5a4a3a' : '#4a3f38',
                border: '2px solid #2a1f18',
                boxShadow: activeTool === tool.id 
                  ? 'inset 2px 2px 0 rgba(0,0,0,0.3)' 
                  : '2px 2px 0 rgba(0,0,0,0.2)'
              }}
            >
              <span style={{ filter: 'drop-shadow(1px 1px 0 rgba(0,0,0,0.3))' }}>
                {tool.icon}
              </span>
            </div>
            
            {/* Tooltip */}
            <div 
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            >
              <span 
                className="px-2 py-1 whitespace-nowrap"
                style={{ 
                  fontFamily: 'var(--font-vt323)',
                  fontSize: '14px',
                  backgroundColor: '#4a3728',
                  color: '#f5f0e1',
                  border: '2px solid #2a1f18'
                }}
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
