export const SCORE_PER_KILL = 10
export const DIFFICULTIES = Object.freeze({
    easy: Object.freeze({ winningScore: 250, maxOperand: 5, baseSpeed: 0.35, speedIncrement: 0.06 }),
    medium: Object.freeze({ winningScore: 350, maxOperand: 9, baseSpeed: 0.5, speedIncrement: 0.08 }),
    hard: Object.freeze({ winningScore: 400, maxOperand: 9, baseSpeed: 0.65, speedIncrement: 0.1 })
})

export function normalizeSettings(settings = {}) {
    return {
        sessionType: settings?.sessionType === 'practice' ? 'practice' : 'arcade',
        mode: ['add', 'sub', 'mul'].includes(settings?.mode) ? settings.mode : 'add',
        difficulty: Object.hasOwn(DIFFICULTIES, settings?.difficulty)
            ? settings.difficulty : 'medium'
    }
}
