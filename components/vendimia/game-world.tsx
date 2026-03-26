'use client';

import { motion } from 'framer-motion';
import type { Agent, Building } from '@/lib/vendimia-types';
import { AgentSprite } from './agent-sprite';

interface GameWorldProps {
  agents: Agent[];
  buildings: Building[];
  selectedAgent: Agent | null;
  onAgentClick: (agent: Agent) => void;
}

export function GameWorld({ agents, buildings, selectedAgent, onAgentClick }: GameWorldProps) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-sky-300 via-sky-200 to-amber-100">
      {/* Mountains Background */}
      <div className="absolute inset-x-0 top-0 h-32 pointer-events-none">
        <svg viewBox="0 0 1200 200" className="w-full h-full" preserveAspectRatio="xMidYMax slice">
          {/* Far mountains */}
          <path d="M0 200 L100 80 L200 140 L350 40 L500 120 L650 30 L800 100 L950 50 L1100 90 L1200 60 L1200 200 Z" 
                fill="#94a3b8" opacity="0.6"/>
          {/* Snow caps */}
          <path d="M350 40 L320 70 L380 70 Z" fill="white" opacity="0.9"/>
          <path d="M650 30 L610 65 L690 65 Z" fill="white" opacity="0.9"/>
          <path d="M950 50 L920 80 L980 80 Z" fill="white" opacity="0.9"/>
          {/* Near mountains */}
          <path d="M0 200 L150 120 L300 160 L450 90 L600 150 L750 80 L900 140 L1050 100 L1200 130 L1200 200 Z" 
                fill="#64748b" opacity="0.7"/>
        </svg>
      </div>

      {/* Sun */}
      <motion.div 
        className="absolute top-4 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 shadow-lg"
        animate={{ 
          boxShadow: ['0 0 30px #fbbf24', '0 0 50px #fbbf24', '0 0 30px #fbbf24']
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Ground Layer */}
      <div className="absolute inset-x-0 bottom-0 top-28 bg-gradient-to-b from-amber-200 to-amber-300">
        {/* Vineyard Rows - Left */}
        <div className="absolute left-[5%] top-[10%] w-[25%] h-[35%]">
          <VineyardRows />
        </div>
        
        {/* Vineyard Rows - Right */}
        <div className="absolute right-[5%] top-[15%] w-[25%] h-[40%]">
          <VineyardRows />
        </div>

        {/* Vineyard Rows - Bottom Left */}
        <div className="absolute left-[8%] bottom-[25%] w-[20%] h-[25%]">
          <VineyardRows />
        </div>

        {/* Buildings */}
        {buildings.map((building) => (
          <BuildingComponent key={building.id} building={building} />
        ))}

        {/* Plaza Fountain */}
        <div className="absolute left-[45%] top-[70%] -translate-x-1/2">
          <Fountain />
        </div>

        {/* Decorative elements */}
        <WineBarrels className="absolute left-[32%] top-[65%]" />
        <WineBarrels className="absolute right-[25%] top-[55%]" />
        <GrapeCart className="absolute left-[20%] top-[40%]" />
        <GrapeCart className="absolute right-[15%] top-[70%]" />
      </div>

      {/* Agents */}
      {agents.map((agent) => (
        <AgentSprite
          key={agent.id}
          agent={agent}
          isSelected={selectedAgent?.id === agent.id}
          onClick={() => onAgentClick(agent)}
        />
      ))}

      {/* Welcome Banner */}
      <motion.div 
        className="absolute top-2 right-4 md:top-4 md:right-8 z-10"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="bg-card/90 backdrop-blur-sm border-2 border-primary px-3 py-2 md:px-4 md:py-2 rounded-lg shadow-lg transform rotate-3">
          <span 
            className="text-xs md:text-sm text-primary font-bold"
            style={{ fontFamily: 'var(--font-pixel)' }}
          >
            BIENVENIDOS A MENDOZA
          </span>
        </div>
      </motion.div>
    </div>
  );
}

function VineyardRows() {
  return (
    <div className="w-full h-full grid grid-rows-5 gap-1">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-end gap-1">
          {[...Array(8)].map((_, j) => (
            <motion.div 
              key={j}
              className="flex-1 flex flex-col items-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: (i * 8 + j) * 0.02 }}
            >
              {/* Vine */}
              <div className="w-1 h-3 md:h-4 bg-amber-800 rounded-t" />
              {/* Leaves */}
              <div className="relative -mt-1">
                <div className="w-4 md:w-5 h-3 md:h-4 bg-green-600 rounded-full" />
                <div className="absolute -left-1 top-0 w-3 h-2 md:h-3 bg-green-500 rounded-full" />
                <div className="absolute -right-1 top-0 w-3 h-2 md:h-3 bg-green-500 rounded-full" />
                {/* Grapes */}
                {j % 2 === 0 && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full shadow" />
                    <div className="w-2 h-2 bg-purple-700 rounded-full -mt-1 ml-1 shadow" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
}

function BuildingComponent({ building }: { building: Building }) {
  const getBuildingStyle = () => {
    switch (building.type) {
      case 'bodega':
        return 'bg-gradient-to-b from-amber-700 to-amber-800 border-amber-900';
      case 'mercado':
        return 'bg-gradient-to-b from-orange-200 to-orange-300 border-orange-400';
      case 'oficina':
        return 'bg-gradient-to-b from-stone-300 to-stone-400 border-stone-500';
      case 'plaza':
        return 'bg-gradient-to-b from-stone-200 to-stone-300 border-stone-400';
      default:
        return 'bg-gradient-to-b from-amber-200 to-amber-300 border-amber-400';
    }
  };

  return (
    <motion.div
      className={`absolute ${getBuildingStyle()} border-2 rounded-lg shadow-xl`}
      style={{
        left: `${building.x}%`,
        top: `${building.y}%`,
        width: `${building.width}%`,
        height: `${building.height}%`,
        transform: 'translate(-50%, -50%)'
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, type: "spring" }}
    >
      {/* Roof */}
      {building.type === 'bodega' && (
        <div className="absolute -top-4 md:-top-6 left-1/2 -translate-x-1/2 w-[110%]">
          <div className="w-full h-4 md:h-6 bg-gradient-to-b from-red-700 to-red-800 rounded-t-lg" 
               style={{ clipPath: 'polygon(10% 100%, 50% 0%, 90% 100%)' }} />
        </div>
      )}
      
      {/* Building Name */}
      <div className="absolute -top-5 md:-top-6 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
        <span 
          className="bg-card/90 text-card-foreground text-[8px] md:text-xs px-2 py-1 rounded border border-border shadow"
          style={{ fontFamily: 'var(--font-vt323)' }}
        >
          {building.name}
        </span>
      </div>

      {/* Windows */}
      <div className="absolute inset-2 md:inset-3 flex flex-wrap gap-1 md:gap-2 justify-center items-center">
        {[...Array(building.type === 'bodega' ? 6 : 3)].map((_, i) => (
          <div 
            key={i} 
            className="w-2 md:w-4 h-3 md:h-5 bg-yellow-200/50 border border-amber-900/30 rounded-sm"
          />
        ))}
      </div>

      {/* Door */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 md:w-6 h-4 md:h-8 bg-amber-900 rounded-t-lg border-2 border-amber-950" />
    </motion.div>
  );
}

function Fountain() {
  return (
    <motion.div 
      className="relative"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.5 }}
    >
      {/* Base */}
      <div className="w-12 md:w-16 h-3 md:h-4 bg-gradient-to-b from-stone-400 to-stone-500 rounded-full shadow-lg" />
      {/* Column */}
      <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 w-2 md:w-3 h-6 md:h-8 bg-stone-400" />
      {/* Top */}
      <motion.div 
        className="absolute bottom-8 md:bottom-11 left-1/2 -translate-x-1/2 w-4 md:w-5 h-4 md:h-5 rounded-full"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)' }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Water drops */}
      <motion.div
        className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="w-1 h-1 bg-blue-400 rounded-full absolute -left-2 top-0" />
        <div className="w-1 h-1 bg-blue-400 rounded-full absolute left-2 top-1" />
        <div className="w-1 h-1 bg-blue-400 rounded-full absolute left-0 top-2" />
      </motion.div>
    </motion.div>
  );
}

function WineBarrels({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex gap-1">
        {[...Array(3)].map((_, i) => (
          <div 
            key={i}
            className="w-4 md:w-6 h-5 md:h-7 rounded-md bg-gradient-to-b from-amber-700 to-amber-900 border border-amber-950"
            style={{ transform: `rotate(${i * 5 - 5}deg)` }}
          >
            <div className="w-full h-0.5 bg-amber-950 absolute top-1" />
            <div className="w-full h-0.5 bg-amber-950 absolute bottom-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

function GrapeCart({ className }: { className?: string }) {
  return (
    <motion.div 
      className={className}
      animate={{ x: [0, 2, 0] }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      {/* Cart body */}
      <div className="w-8 md:w-10 h-4 md:h-5 bg-amber-800 rounded-sm relative">
        {/* Grapes */}
        <div className="absolute -top-2 left-1 flex gap-0.5">
          <div className="w-2 h-2 bg-purple-600 rounded-full" />
          <div className="w-2 h-2 bg-purple-700 rounded-full" />
          <div className="w-2 h-2 bg-purple-600 rounded-full" />
        </div>
        {/* Wheels */}
        <div className="absolute -bottom-1 left-1 w-2 h-2 bg-amber-950 rounded-full" />
        <div className="absolute -bottom-1 right-1 w-2 h-2 bg-amber-950 rounded-full" />
      </div>
    </motion.div>
  );
}
