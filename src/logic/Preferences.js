import { reactive, watch } from 'vue'

const KEY = 'mathMonstersPreferences'
const defaults = { locale: 'zh', muted: false, mode: 'add', difficulty: 'medium' }

/** 儲存遭瀏覽器封鎖時仍以預設值進行遊戲。 */
export function loadPreferences(storage) {
    try {
        const saved = JSON.parse((storage || globalThis.localStorage)?.getItem(KEY) || '{}') || {}
        return {
            locale: ['zh', 'en'].includes(saved.locale) ? saved.locale : defaults.locale,
            muted: typeof saved.muted === 'boolean' ? saved.muted : defaults.muted,
            mode: ['add', 'sub', 'mul'].includes(saved.mode) ? saved.mode : defaults.mode,
            difficulty: ['easy', 'medium', 'hard'].includes(saved.difficulty)
                ? saved.difficulty : defaults.difficulty
        }
    } catch { return { ...defaults } }
}

export function savePreferences(value, storage) {
    try {
        (storage || globalThis.localStorage)?.setItem(KEY, JSON.stringify(value))
        return true
    } catch { return false }
}

export function readHighScore(storage) {
    try {
        const value = Number((storage || globalThis.localStorage)?.getItem('mathMonstersHighScore'))
        return Number.isSafeInteger(value) && value > 0 ? value : 0
    } catch { return 0 }
}

export function saveHighScore(value) {
    try { globalThis.localStorage?.setItem('mathMonstersHighScore', String(value)) } catch { /* 使用當局紀錄 */ }
}

export const preferences = reactive(loadPreferences())
watch(preferences, (value) => savePreferences(value), { flush: 'sync' })
