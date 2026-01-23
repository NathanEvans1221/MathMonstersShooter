import { createI18n } from 'vue-i18n'

/**
 * 國際化 (i18n) 設定
 * 定義支援的語言 (英文、繁體中文) 及其對應的介面文字
 */
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
        loading: 'Game Loading...',
        paused: 'PAUSED',
        resume: 'RESUME',
        exit: 'EXIT',
        you_win: 'CONGRATULATIONS!',
        mode: 'Mode',
        difficulty: 'Diff',
        modes: {
            add: 'Addition',
            sub: 'Subtraction',
            mul: 'Multiplication'
        },
        difficulties: {
            easy: 'Easy',
            medium: 'Medium',
            hard: 'Hard'
        }
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
        loading: '遊戲載入中...',
        paused: '遊戲暫停',
        resume: '繼續遊戲',
        exit: '離開遊戲',
        you_win: '恭喜你破關!',
        mode: '模式',
        difficulty: '難度',
        modes: {
            add: '加法',
            sub: '減法',
            mul: '乘法'
        },
        difficulties: {
            easy: '簡單',
            medium: '中等',
            hard: '困難'
        }
    }

}

export const i18n = createI18n({
    legacy: false, // 使用 Vue 3 Composition API 模式
    locale: 'zh', // 預設語言：繁體中文
    fallbackLocale: 'en', // 備援語言：英文
    messages
})

