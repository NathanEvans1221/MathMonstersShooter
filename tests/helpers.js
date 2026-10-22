import { SoundManager } from '../src/logic/SoundManager.js'
import { GameEngine } from '../src/logic/GameEngine.js'

/** 可控制的瀏覽器邊界，遊戲與數學邏輯仍使用正式模組。 */
export function createHarness(t) {
    const frames = new Map()
    const timers = new Map()
    const events = { scores: [], lives: [], options: [], endings: [], hints: [] }
    let nextId = 0
    let measurements = 0
    const ctx = new Proxy({
        measureText: (text) => { measurements++; return { width: text.length * 12 } }
    }, { get: (target, key) => key in target ? target[key] : () => {} })
    const canvas = { width: 600, height: 900, getContext: () => ctx }
    const globals = {
        Image: class {
            complete = true
            naturalWidth = 100
            addEventListener() {}
            removeEventListener() {}
        },
        requestAnimationFrame: (callback) => { frames.set(++nextId, callback); return nextId },
        cancelAnimationFrame: (id) => frames.delete(id),
        setTimeout: (callback) => { timers.set(++nextId, callback); return nextId },
        clearTimeout: (id) => timers.delete(id)
    }
    for (const [key, value] of Object.entries(globals)) {
        const descriptor = Object.getOwnPropertyDescriptor(globalThis, key)
        Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
        t.after(() => {
            if (descriptor) Object.defineProperty(globalThis, key, descriptor)
            else delete globalThis[key]
        })
    }
    for (const key of ['shoot', 'wrong', 'explosion', 'playBGM', 'stopBGM',
        'pauseBGM', 'resumeBGM', 'playVictoryBGM']) t.mock.method(SoundManager, key, () => {})
    const engine = new GameEngine(canvas, {
        onScore: (value) => events.scores.push(value),
        onLives: (value) => events.lives.push(value),
        onOptions: (value) => events.options.push(value),
        onGameOver: (...value) => events.endings.push(value),
        onHint: (value) => events.hints.push(value),
        onWrongAnswer: () => {},
        onCorrectAnswer: () => {}
    })
    engine.init()
    engine.resize(600, 900)
    return { engine, events, frames, timers, canvas,
        get measurements() { return measurements },
        tick(timestamp) {
            const pending = [...frames.values()]
            frames.clear()
            pending.forEach((callback) => callback(timestamp))
        }
    }
}

export function addTarget(engine, data = {}) {
    engine.entityManager.addMonster({ x: 300, y: 100, speed: 0.5,
        equation: '2 + 3 = ?', answer: 5, options: [4, 5, 6], ...data })
    return engine.entityManager.monsters.at(-1)
}

export function seededRandom(seed = 12345) {
    return () => {
        seed = (seed * 1664525 + 1013904223) >>> 0
        return seed / 4294967296
    }
}
