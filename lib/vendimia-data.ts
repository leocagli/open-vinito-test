import type { Agent, ChatMessage, Building } from './vendimia-types';

export const initialAgents: Agent[] = [
  { id: '1', name: 'Valentina', avatar: '👩‍🌾', task: 'cosecha', location: 'viñedo-norte', progress: 75, x: 15, y: 25, color: '#8B5CF6' },
  { id: '2', name: 'Martín', avatar: '👨‍🌾', task: 'riego', location: 'viñedo-sur', progress: 45, x: 75, y: 35, color: '#3B82F6' },
  { id: '3', name: 'Lucía', avatar: '👩‍🔬', task: 'fermentacion', location: 'bodega', progress: 90, x: 45, y: 45, color: '#EC4899' },
  { id: '4', name: 'Diego', avatar: '👨‍💼', task: 'cata', location: 'oficina', progress: 60, x: 25, y: 65, color: '#F59E0B' },
  { id: '5', name: 'Camila', avatar: '👩‍💻', task: 'poda', location: 'viñedo-norte', progress: 30, x: 85, y: 55, color: '#10B981' },
  { id: '6', name: 'Santiago', avatar: '👨‍🍳', task: 'embotellado', location: 'bodega', progress: 55, x: 55, y: 75, color: '#6366F1' },
];

export const buildings: Building[] = [
  { id: 'bodega', name: 'Bodega Central', type: 'bodega', x: 35, y: 35, width: 30, height: 25 },
  { id: 'mercado', name: 'Mercado de Skills', type: 'mercado', x: 10, y: 55, width: 20, height: 15 },
  { id: 'oficina', name: 'Oficina IA', type: 'oficina', x: 70, y: 60, width: 18, height: 15 },
  { id: 'plaza', name: 'Plaza Vendimia', type: 'plaza', x: 45, y: 70, width: 15, height: 12 },
];

export const taskLabels: Record<string, { label: string; icon: string }> = {
  cosecha: { label: 'Cosecha', icon: '🍇' },
  riego: { label: 'Riego', icon: '💧' },
  poda: { label: 'Poda', icon: '✂️' },
  fermentacion: { label: 'Fermentación', icon: '🧪' },
  embotellado: { label: 'Embotellado', icon: '🍾' },
  cata: { label: 'Cata', icon: '🍷' },
  descanso: { label: 'Descanso', icon: '😴' },
};

export const initialMessages: ChatMessage[] = [
  { id: '1', agentName: 'Sistema', message: '¡Bienvenidos a Vendimia World!', timestamp: new Date(), type: 'celebration' },
  { id: '2', agentName: 'Valentina', message: 'Cosecha Malbec al 75%', timestamp: new Date(), type: 'task' },
  { id: '3', agentName: 'Lucía', message: 'Fermentación casi lista', timestamp: new Date(), type: 'info' },
  { id: '4', agentName: 'Sistema', message: 'Agentes IA sincronizados', timestamp: new Date(), type: 'info' },
];

export const celebrationMessages = [
  '¡Viva la vendimia!',
  '¡Excelente cosecha!',
  '¡Los Andes nos bendicen!',
  '¡Malbec de primera!',
  '¡Mendoza orgullosa!',
];
