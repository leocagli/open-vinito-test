'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatMessage } from '@/lib/vendimia-types';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

export function ChatPanel({ messages, onSendMessage }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const getMessageColor = (type: ChatMessage['type']) => {
    switch (type) {
      case 'celebration': return 'text-primary';
      case 'task': return 'text-accent';
      case 'warning': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getMessageIcon = (type: ChatMessage['type']) => {
    switch (type) {
      case 'celebration': return '🎉';
      case 'task': return '📋';
      case 'warning': return '⚠️';
      default: return '💬';
    }
  };

  return (
    <motion.div 
      className="absolute bottom-0 left-0 right-0 md:left-4 md:right-auto md:bottom-4 md:w-96 z-20"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8 }}
    >
      <div className="bg-card/95 backdrop-blur-md border-2 border-border rounded-t-xl md:rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/50 transition-colors border-b border-border"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <span 
              className="text-sm font-bold text-card-foreground"
              style={{ fontFamily: 'var(--font-vt323)' }}
            >
              Chat de la Bodega
            </span>
          </div>
          <motion.span 
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="text-muted-foreground"
          >
            ▲
          </motion.span>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              {/* Messages */}
              <div className="h-48 overflow-y-auto p-3 space-y-2 bg-card/50">
                {messages.map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-2"
                  >
                    <span className="text-sm">{getMessageIcon(msg.type)}</span>
                    <div className="flex-1 min-w-0">
                      <span 
                        className={`text-sm font-bold ${getMessageColor(msg.type)}`}
                        style={{ fontFamily: 'var(--font-vt323)' }}
                      >
                        [{msg.agentName}]:
                      </span>
                      <span 
                        className="text-sm text-card-foreground ml-1"
                        style={{ fontFamily: 'var(--font-vt323)' }}
                      >
                        {msg.message}
                      </span>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-3 border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe un comando..."
                    className="flex-1 bg-input text-foreground text-sm px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    style={{ fontFamily: 'var(--font-vt323)', fontSize: '16px' }}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                    style={{ fontFamily: 'var(--font-vt323)' }}
                  >
                    Enviar
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed preview */}
        {!isExpanded && messages.length > 0 && (
          <div className="px-4 py-2 bg-card/50">
            <div className="flex items-center gap-2">
              <span className="text-sm">{getMessageIcon(messages[messages.length - 1].type)}</span>
              <span 
                className="text-xs text-muted-foreground truncate"
                style={{ fontFamily: 'var(--font-vt323)' }}
              >
                {messages[messages.length - 1].agentName}: {messages[messages.length - 1].message}
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
