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
      {/* Toggle Button */}
      <motion.button
        className="absolute top-4 right-4 z-30 md:hidden bg-card/90 backdrop-blur-sm p-3 rounded-lg border-2 border-border shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-xl">👥</span>
      </motion.button>

      {/* Sidebar */}
      <motion.div
        className={`
          absolute top-0 right-0 h-full z-20
          md:relative md:w-64 md:flex-shrink-0
          ${isOpen ? 'w-64' : 'w-0 md:w-64'}
        `}
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              className="h-full w-64 bg-card/95 backdrop-blur-md border-l-2 border-border shadow-2xl overflow-hidden"
              initial={{ x: isMobile ? 100 : 0, opacity: isMobile ? 0 : 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
            >
              {/* Header */}
              <div className="p-4 border-b border-border bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🍇</span>
                    <h2 
                      className="text-sm font-bold text-card-foreground"
                      style={{ fontFamily: 'var(--font-pixel)' }}
                    >
                      Agentes
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="md:hidden text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Agents List */}
              <div className="p-3 space-y-2 overflow-y-auto h-[calc(100%-60px)]">
                {agents.map((agent, index) => {
                  const taskInfo = taskLabels[agent.task];
                  const isSelected = selectedAgent?.id === agent.id;
                  
                  return (
                    <motion.button
                      key={agent.id}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 * index }}
                      onClick={() => {
                        onAgentSelect(agent);
                        setIsOpen(false);
                      }}
                      className={`
                        w-full p-3 rounded-lg border-2 transition-all text-left
                        ${isSelected 
                          ? 'border-primary bg-primary/20 shadow-lg' 
                          : 'border-border bg-card/50 hover:border-primary/50 hover:bg-muted/50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shadow-md"
                          style={{ backgroundColor: agent.color }}
                        >
                          {agent.avatar}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div 
                            className="text-sm font-bold text-card-foreground truncate"
                            style={{ fontFamily: 'var(--font-vt323)' }}
                          >
                            {agent.name}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-xs">{taskInfo.icon}</span>
                            <span 
                              className="text-xs text-muted-foreground"
                              style={{ fontFamily: 'var(--font-vt323)' }}
                            >
                              {taskInfo.label}
                            </span>
                          </div>
                        </div>

                        {/* Status indicator */}
                        <div className="flex flex-col items-end gap-1">
                          <motion.div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: agent.color }}
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                          <span 
                            className="text-xs text-muted-foreground"
                            style={{ fontFamily: 'var(--font-vt323)' }}
                          >
                            {agent.progress}%
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: agent.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${agent.progress}%` }}
                          transition={{ duration: 1, delay: 0.1 * index }}
                        />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Mobile overlay */}
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-background/50 z-10 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
