import type { ReputationAction } from '@/lib/protocols/track8004'

export interface ReputationSnapshot {
  actorId: string
  score: number
  updatedAt: string
}

type ReputationDb = Map<string, ReputationSnapshot>

const globalDb = globalThis as typeof globalThis & {
  __openVinitoReputationDb__?: ReputationDb
}

const db: ReputationDb = globalDb.__openVinitoReputationDb__ ?? new Map()
if (!globalDb.__openVinitoReputationDb__) {
  globalDb.__openVinitoReputationDb__ = db
}

export function getReputation(actorId: string): ReputationSnapshot {
  const existing = db.get(actorId)
  if (existing) return existing

  const created: ReputationSnapshot = {
    actorId,
    score: 500,
    updatedAt: new Date().toISOString(),
  }
  db.set(actorId, created)
  return created
}

export function applyReputationAction(action: ReputationAction): ReputationSnapshot {
  const current = getReputation(action.actorId)
  const nextScore = Math.max(0, Math.min(1000, current.score + action.delta))

  const updated: ReputationSnapshot = {
    actorId: action.actorId,
    score: nextScore,
    updatedAt: new Date().toISOString(),
  }

  db.set(action.actorId, updated)
  return updated
}

export function listReputations(limit = 50): ReputationSnapshot[] {
  return Array.from(db.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
