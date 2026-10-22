import { SCORE_PER_KILL } from './GameSettings.js'

export function getProgress(score, target) {
    if (!Number.isFinite(target) || target <= 0) return { percent: 0, remaining: 0 }
    const current = Number.isFinite(score) ? Math.max(0, Math.min(target, score)) : 0
    return {
        percent: Math.round(current / target * 100),
        remaining: Math.ceil((target - current) / SCORE_PER_KILL)
    }
}
