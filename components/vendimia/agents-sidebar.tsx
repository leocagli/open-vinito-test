'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Agent } from '@/lib/vendimia-types';
import { taskLabels } from '@/lib/vendimia-data';

interface AgentsSidebarProps {
  agents: Agent[];
  selectedAgent: Agent | null;
  onAgentSelect: (agent: Agent) => void;
}

// Pixel art avatar component
function PixelAvatar({ agent, size = 'normal' }: { agent: Agent; size?: 'normal' | 'small' }) {
  const dimensions = size === 'small' ? { head: 'w-6 h-6', body: 'w-7 h-4' } : { head: 'w-8 h-8', body: 'w-9 h-5' };
  
  return (
    <div className="flex flex-col items-center">
      {/* Head */}
      <div 
        className={`${dimensions.head} relative`}
        style={{
          backgroundColor: agent.skinColor || '#e8c39e',
          border: '2px solid #4a3728'
        }}
      >
        {/* Hair */}
        <div 
          className="absolute -top-1 left-0 right-0 h-1.5"
          style={{ backgroundColor: agent.hairColor || '#5c4033' }}
        />
        {/* Eyes */}
        <div className="absolute top-2.5 left-1 w-1 h-1 bg-black" />
        <div className="absolute top-2.5 right-1 w-1 h-1 bg-black" />
      </div>
      {/* Body */}
      <div 
        className={`${dimensions.body} -mt-0.5`}
        style={{
          backgroundColor: agent.shirtColor || '#4a6fa5',
          border: '2px solid #4a3728',
          borderTop: 'none'
        }}
      />
    </div>
  );
}

export function AgentsSidebar({ agents, selectedAgent, onAgentSelect }: AgentsSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const showSidebar = isOpen || !isMobile;

  return (
    <>
      {/* Toggle Button for mobile */}
      <motion.button
        className="absolute top-4 right-4 z-30 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.95 }}
        style={{
          backgroundColor: '#3d3530',
          border: '2px solid #4a3728',
          padding: '8px 12px',
          boxShadow: '3px 3px 0 rgba(0,0,0,0.3)'
        }}
      >
        <span 
          style={{ 
            fontFamily: 'var(--font-vt323)',
            color: '#f5f0e1',
            fontSize: '14px'
          }}
        >
          Avatar
        </span>
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            className="absolute top-4 right-4 z-20 md:top-4 md:right-4"
            initial={{ x: isMobile ? 100 : 0, opacity: isMobile ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <div 
              className="w-48 overflow-hidden"
              style={{
                backgroundColor: '#3d3530',
                border: '3px solid #4a3728',
                boxShadow: '4px 4px 0 rgba(0,0,0,0.3)'
              }}
            >
              {/* Header */}
              <div 
                className="flex items-center justify-between px-3 py-2"
                style={{ 
                  backgroundColor: '#4a3728',
                  borderBottom: '2px solid #2a1f18'
                }}
              >
                <span 
                  style={{ 
                    fontFamily: 'var(--font-vt323)',
                    color: '#f5f0e1',
                    fontSize: '16px',
                    letterSpacing: '1px'
                  }}
                >
                  Avatar
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="md:hidden hover:opacity-80"
                  style={{ color: '#f5f0e1' }}
                >
                  x
                </button>
              </div>

              {/* Agents List */}
              <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
                {agents.map((agent, index) => {
                  const taskInfo = taskLabels[agent.task];
                  const isSelected = selectedAgent?.id === agent.id;
                  
                  return (
                    <motion.button
                      key={agent.id}
                      initial={{ x: 10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.05 * index }}
                      onClick={() => {
                        onAgentSelect(agent);
                        if (isMobile) setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-left transition-colors"
                      style={{
                        backgroundColor: isSelected ? '#5a4a3a' : 'transparent',
                        borderLeft: isSelected ? '3px solid #8b5cf6' : '3px solid transparent'
                      }}
                    >
                      {/* Avatar */}
                      <PixelAvatar agent={agent} size="small" />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div 
                          className="truncate"
                          style={{ 
                            fontFamily: 'var(--font-vt323)',
                            color: '#f5f0e1',
                            fontSize: '14px'
                          }}
                        >
                          {agent.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs">{taskInfo.icon}</span>
                          <span 
                            style={{ 
                              fontFamily: 'var(--font-vt323)',
                              color: '#9ca3af',
                              fontSize: '12px'
                            }}
                          >
                            {taskInfo.label}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar mini */}
                      <div 
                        className="w-12 h-2"
                        style={{
                          backgroundColor: '#2a2520',
                          border: '1px solid #4a3728'
                        }}
                      >
                        <div 
                          className="h-full transition-all"
                          style={{ 
                            width: `${agent.progress}%`,
                            backgroundColor: agent.color
                          }}
                        />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      {isOpen && isMobile && (
        <motion.div
          className="fixed inset-0 z-10"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
