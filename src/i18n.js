import { createI18n } from 'vue-i18n'

const messages = {
    en: {
        title: 'MATH MONSTERS',
        subtitle: 'SHOOTER',
        desc: 'Math Calculation Fighter',
        start: 'START MISSION',
        score: 'SCORE:',
        lives: 'LIVES:',
        wait_target: 'Wait for Target...',
        game_over: 'GAME OVER',
        final_score: 'FINAL SCORE:',
        retry: 'RETRY MISSION',
        loading: 'Game Loading...'
    },
    zh: {
        title: '數學怪物',
        subtitle: '射擊手',
        desc: '心算戰鬥機',
        start: '開始任務',
        score: '得分:',
        lives: '生命:',
        wait_target: '等待目標...',
        game_over: '遊戲結束',
        final_score: '最終分數:',
        retry: '重新任務',
        loading: '遊戲載入中...'
    }
}

export const i18n = createI18n({
    legacy: false, // Use Composition API
    locale: 'zh', // Default locale
    fallbackLocale: 'en',
    messages
})
