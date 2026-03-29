export type AgentTask =
  | 'cosecha'
  | 'riego'
  | 'poda'
  | 'fermentacion'
  | 'embotellado'
  | 'cata'
  | 'descanso'
  | 'administracion'
  | 'contabilidad'
  | 'marketing'
  | 'venta'
  | 'espera';

export type AgentLocation =
  | 'viñedo-norte'
  | 'viñedo-sur'
  | 'bodega'
  | 'plaza'
  | 'mercado'
  | 'oficina';

export interface AgentWallet {
  publicKey: string;
  usdcBalance: string;
  xlmBalance: string;
  funded: boolean;
  network: 'testnet' | 'mainnet';
  mppChannelOpen?: boolean;
  blendDeposited?: string;
  lastTxHash?: string;
}

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  task: AgentTask;
  location: AgentLocation;
  progress: number;
  x: number;
  y: number;
  color: string;
  model?: string;
  skills?: string[];
  reputationScore?: number;
  skinColor?: string;
  hairColor?: string;
  shirtColor?: string;
  wallet?: AgentWallet;
}

export interface ChatMessage {
  id: string;
  agentName: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'task' | 'celebration' | 'warning' | 'payment';
}

export interface Building {
  id: string;
  name: string;
  type: 'bodega' | 'mercado' | 'oficina' | 'plaza' | 'viñedo';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OraclePrice {
  asset: string;
  priceUsd: number;
  source: 'reflector' | 'mock';
  timestamp: number;
}

export interface DexSwapQuote {
  fromAsset: string;
  toAsset: string;
  fromAmount: string;
  toAmount: string;
  price: number;
  route: string;
  protocol: 'soroswap' | 'sdex' | 'phoenix';
}

export interface BlendPosition {
  publicKey: string;
  deposited: string;
  earned: string;
  apy: number;
  poolId: string;
}

export interface MppChannel {
  channelId: string;
  from: string;
  to: string;
  balance: string;
  currency: 'USDC' | 'XLM';
  status: 'open' | 'closing' | 'closed';
}
