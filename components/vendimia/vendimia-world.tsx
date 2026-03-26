'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Agent, ChatMessage } from '@/lib/vendimia-types';
import { initialAgents, buildings, initialMessages, celebrationMessages, taskLabels } from '@/lib/vendimia-data';
import { GameWorld } from './game-world';
import { ChatPanel } from './chat-panel';
import { AgentsSidebar } from './agents-sidebar';
import { Toolbar } from './toolbar';
import { TopBar } from './top-bar';

export function VendimiaWorld() {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [day, setDay] = useState(1);
  const [totalGrapes, setTotalGrapes] = useState(12450);
  const [showWelcome, setShowWelcome] = useState(true);

  // Simulate agent progress
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prevAgents => 
        prevAgents.map(agent => {
          const newProgress = agent.progress + Math.random() * 3;
          
          if (newProgress >= 100) {
            // Task completed - add message and reset
            const taskInfo = taskLabels[agent.task];
            addMessage({
              agentName: agent.name,
              message: `${taskInfo.label} completada!`,
              type: 'celebration'
            });
            
            // Add grapes
            setTotalGrapes(prev => prev + Math.floor(Math.random() * 500 + 200));
            
            return {
              ...agent,
              progress: 0,
              task: getRandomTask()
            };
          }
          
          return { ...agent, progress: Math.min(newProgress, 100) };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Simulate day passing
  useEffect(() => {
    const dayInterval = setInterval(() => {
      setDay(prev => {
        const newDay = prev + 1;
        if (newDay % 7 === 0) {
          addMessage({
            agentName: 'Sistema',
            message: celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)],
            type: 'celebration'
          });
        }
        return newDay;
      });
    }, 30000);

    return () => clearInterval(dayInterval);
  }, []);

  // Move agents randomly
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setAgents(prevAgents => 
        prevAgents.map(agent => ({
          ...agent,
          x: Math.max(10, Math.min(90, agent.x + (Math.random() - 0.5) * 8)),
          y: Math.max(20, Math.min(85, agent.y + (Math.random() - 0.5) * 6))
        }))
      );
    }, 5000);

    return () => clearInterval(moveInterval);
  }, []);

  const getRandomTask = () => {
    const tasks = ['cosecha', 'riego', 'poda', 'fermentacion', 'embotellado', 'cata'] as const;
    return tasks[Math.floor(Math.random() * tasks.length)];
  };

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...msg,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev.slice(-20), newMessage]);
  }, []);

  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent);
    addMessage({
      agentName: 'Sistema',
      message: `Agente ${agent.name} seleccionado`,
      type: 'info'
    });
  };

  const handleToolSelect = (tool: string) => {
    setActiveTool(activeTool === tool ? null : tool);
    addMessage({
      agentName: 'Sistema',
      message: `Herramienta: ${tool}`,
      type: 'info'
    });
  };

  const handleSendMessage = (message: string) => {
    addMessage({
      agentName: 'Usuario',
      message,
      type: 'info'
    });

    // Simulate AI response
    setTimeout(() => {
      const randomAgent = agents[Math.floor(Math.random() * agents.length)];
      addMessage({
        agentName: randomAgent.name,
        message: `Recibido! Procesando "${message}"...`,
        type: 'task'
      });
    }, 1000);
  };

  const getSeason = () => {
    if (day <= 90) return 'Verano - Cosecha';
    if (day <= 180) return 'Otoño - Fermentación';
    if (day <= 270) return 'Invierno - Poda';
    return 'Primavera - Floración';
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Welcome Modal */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-card border-4 border-primary rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
            >
              <div className="text-center">
                <motion.div
                  className="text-6xl mb-4"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🍇
                </motion.div>
                <h1 
                  className="text-xl md:text-2xl font-bold text-primary mb-4"
                  style={{ fontFamily: 'var(--font-pixel)' }}
                >
                  VENDIMIA WORLD
                </h1>
                <p 
                  className="text-muted-foreground mb-6 text-sm md:text-base"
                  style={{ fontFamily: 'var(--font-vt323)' }}
                >
                  Una ciudad de agentes IA inspirada en Mendoza y la vendimia argentina. 
                  Observa cómo los agentes trabajan en los viñedos, la bodega y el mercado.
                </p>
                <div className="space-y-3 mb-6 text-left">
                  <div className="flex items-center gap-3 text-card-foreground">
                    <span className="text-xl">👆</span>
                    <span className="text-sm" style={{ fontFamily: 'var(--font-vt323)' }}>
                      Toca un agente para ver su información
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-card-foreground">
                    <span className="text-xl">💬</span>
                    <span className="text-sm" style={{ fontFamily: 'var(--font-vt323)' }}>
                      Usa el chat para interactuar
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-card-foreground">
                    <span className="text-xl">👥</span>
                    <span className="text-sm" style={{ fontFamily: 'var(--font-vt323)' }}>
                      Panel de agentes a la derecha
                    </span>
                  </div>
                </div>
                <motion.button
                  onClick={() => setShowWelcome(false)}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
                  style={{ fontFamily: 'var(--font-pixel)' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  ¡COMENZAR!
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex h-full">
        {/* Game World */}
        <div className="flex-1 relative">
          <TopBar season={getSeason()} day={day} totalGrapes={totalGrapes} />
          
          <GameWorld
            agents={agents}
            buildings={buildings}
            selectedAgent={selectedAgent}
            onAgentClick={handleAgentClick}
          />

          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
          />

          <Toolbar
            onToolSelect={handleToolSelect}
            activeTool={activeTool}
          />
        </div>

        {/* Sidebar */}
        <AgentsSidebar
          agents={agents}
          selectedAgent={selectedAgent}
          onAgentSelect={handleAgentClick}
        />
      </div>

      {/* Selected Agent Detail - Mobile */}
      <AnimatePresence>
        {selectedAgent && (
          <motion.div
            className="fixed bottom-20 left-4 right-4 md:hidden z-30"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
          >
            <div className="bg-card/95 backdrop-blur-md border-2 border-primary rounded-xl p-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                    style={{ backgroundColor: selectedAgent.color }}
                  >
                    {selectedAgent.avatar}
                  </div>
                  <div>
                    <h3 
                      className="font-bold text-card-foreground"
                      style={{ fontFamily: 'var(--font-vt323)' }}
                    >
                      {selectedAgent.name}
                    </h3>
                    <p 
                      className="text-sm text-muted-foreground"
                      style={{ fontFamily: 'var(--font-vt323)' }}
                    >
                      {taskLabels[selectedAgent.task].icon} {taskLabels[selectedAgent.task].label}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-muted-foreground hover:text-foreground p-2"
                >
                  ✕
                </button>
              </div>
              <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    backgroundColor: selectedAgent.color,
                    width: `${selectedAgent.progress}%`
                  }}
                />
              </div>
              <p 
                className="mt-2 text-xs text-right text-muted-foreground"
                style={{ fontFamily: 'var(--font-vt323)' }}
              >
                Progreso: {Math.round(selectedAgent.progress)}%
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
