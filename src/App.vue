<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import GameCanvas from './components/GameCanvas.vue'
import GameHUD from './components/GameHUD.vue'
import AnswerPanel from './components/AnswerPanel.vue'
import StartScreen from './components/StartScreen.vue'
import { TTSManager } from './logic/TTSManager.js'
import { SoundManager } from './logic/SoundManager.js'

const { t, locale } = useI18n()

// --- 響應式狀態 ---
const gameState = ref('start') // 遊戲狀態：start (初始), playing (進行中), paused (暫停), gameover (結算)
const score = ref(0) // 當前分數
const lives = ref(3) // 剩餘生命
const currentOptions = ref([]) // 當前顯示的答案選項
const gameCanvas = ref(null) // 對 GameCanvas 組件的引用
const isWin = ref(false) // 是否為勝利通關狀態

/**
 * 調用 TTS 播放多國語言文字
 * @param {string} key - i18n 的關鍵字
 */
const speak = (key) => {
    TTSManager.speak(t(key), locale.value)
}

/**
 * 開始或重新開始遊戲
 */
const startGame = () => {
    gameState.value = 'playing'
    score.value = 0
    lives.value = 3
    currentOptions.value = []
    
    // 延遲一點點確保 DOM 已渲染，然後重置遊戲引擎
    setTimeout(() => {
        if(gameCanvas.value) gameCanvas.value.restartGame()
    }, 50)
}

// --- 事件處理常式 ---

const onStartClick = () => {
    speak('start')
    startGame()
}

const onResumeClick = () => {
    speak('resume')
    resumeGame()
}

/**
 * 處理「離開遊戲」回到主畫面
 */
const onExitClick = () => {
    speak('exit')
    gameState.value = 'start'
    
    // 停止當前背景音樂並重置，確保下次重新開始時音樂正確
    SoundManager.stopBGM()
    
    // 返回主畫面後恢復播放背景音樂
    setTimeout(() => {
        SoundManager.playBGM()
    }, 100)
}

const onRetryClick = () => {
    speak('retry')
    startGame()
}

/**
 * 全局點擊監聽：用於繞過瀏覽器對自動播放音訊的限制
 * 當使用者發生任何點擊行為時，嘗試初始化並啟動音訊背景音樂
 */
const handleInteraction = () => {
    if (typeof SoundManager === 'undefined') return;
    
    SoundManager.init();
    if (SoundManager.ctx && SoundManager.ctx.state === 'suspended' && !SoundManager.muted) {
        SoundManager.ctx.resume();
    }
    // 僅在開始畫面或遊戲進行中播放音樂 (遊戲結束時會停止)
    if (gameState.value === 'start' || gameState.value === 'playing') {
        SoundManager.playBGM();
    }
}

// 組件掛載與卸載時管理事件監聽
onMounted(() => {
    document.addEventListener('click', handleInteraction);
})

onUnmounted(() => {
    document.removeEventListener('click', handleInteraction);
})

// --- 來自 GameCanvas 的回調事件 ---

const onScore = (val) => score.value = val
const onLives = (val) => lives.value = val
const onOptions = (opts) => currentOptions.value = opts

/**
 * 處理遊戲結束或勝利
 * @param {number} finalScore - 最終分數
 * @param {boolean} winStatus - 是否勝利
 */
const onGameOver = (finalScore, winStatus = false) => {
    score.value = finalScore
    isWin.value = winStatus
    gameState.value = 'gameover'
    
    // 語音宣告結果
    if (winStatus) {
        TTSManager.speak(t('you_win'), locale.value)
    } else {
        TTSManager.speak(t('game_over'), locale.value)
    }
}

/**
 * 答錯時的處理：播放隨機鼓勵語句並觸發畫面震動
 */
const onWrong = () => {
    // 隨機失敗鼓勵語句
    const phrases = ['差一點', '錯了', '不對唷', '唉', '怎麼可能'];
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

    if (locale.value === 'zh') {
        TTSManager.speak(randomPhrase, 'zh');
    } else {
        const enPhrases = ['Almost!', 'Wrong!', 'Not right!', 'Oh no!', 'Impossible!'];
        const idx = phrases.indexOf(randomPhrase);
        TTSManager.speak(enPhrases[idx > -1 ? idx : 0], 'en');
    }

    // 觸發畫面整體的震動特效
    const el = document.getElementById('app-container');
    if(el) {
        el.classList.add('shake')
        setTimeout(() => el.classList.remove('shake'), 300)
    }
}

/**
 * 答對時的處理：播放隨機讚美語句
 */
const onCorrect = () => {
    // 隨機讚美語句
    const praises = ['好棒', '讚', '真厲害', '完美', '一百分'];
    const randomPraise = praises[Math.floor(Math.random() * praises.length)];
    
    if (locale.value === 'zh') {
        TTSManager.speak(randomPraise, 'zh');
    } else {
        const enPraises = ['Great!', 'Good job!', 'Awesome!', 'Perfect!', 'One hundred percent!'];
        const idx = praises.indexOf(randomPraise);
        TTSManager.speak(enPraises[idx > -1 ? idx : 0], 'en');
    }
}

/**
 * 處理玩家選取答案後的發信給 Canvas 引擎
 */
const handleAnswer = (val) => {
    if (gameCanvas.value) {
        gameCanvas.value.handleAnswer(val)
    }
}

const onPause = () => {
    gameState.value = 'paused';
    if(gameCanvas.value) gameCanvas.value.setPaused(true);
}

const resumeGame = () => {
    gameState.value = 'playing';
    if(gameCanvas.value) gameCanvas.value.setPaused(false);
}
</script>


<template>
  <div id="app-container">
    <GameCanvas 
        ref="gameCanvas"
        :active="gameState === 'playing'"
        @score="onScore"
        @lives="onLives"
        @options="onOptions"
        @gameover="onGameOver"
        @wrong="onWrong"
        @correct="onCorrect"
    />
    
    <StartScreen v-if="gameState === 'start'" @start="onStartClick" />
    
    <div v-if="gameState === 'playing'">
        <GameHUD :score="score" :lives="lives" @pause="onPause" />
        <AnswerPanel :options="currentOptions" @answer="handleAnswer" />
    </div>

    <div v-if="gameState === 'gameover'" class="gameover-screen glass">
        <h1 class="neon-text" :style="{color: isWin ? '#00ff99' : '#ff3366'}">
            {{ isWin ? $t('you_win') : $t('game_over') }}
        </h1>
        <h2>{{ $t('final_score') }} {{ score }}</h2>
        <button class="neon-button" @click="onRetryClick">{{ $t('retry') }}</button>
    </div>

    <!-- Pause Menu -->
    <div v-if="gameState === 'paused'" class="pause-screen glass">
        <h1 class="neon-text">{{ $t('paused') }}</h1>
        <button class="neon-button" @click="onResumeClick">{{ $t('resume') }}</button>
        <div style="height: 20px"></div>
        <button class="neon-button" @click="onExitClick">{{ $t('exit') }}</button>
    </div>
  </div>
</template>

<style scoped>
#app-container {
    width: 100vw;
    height: 100vh;
    position: relative;
    overflow: hidden;
    background: #0B0F29; /* Fallback */
}

.gameover-screen {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 1.5rem;
  text-align: center;
  border-radius: 20px;
  border: 1px solid #ff3366;
  background: rgba(11, 15, 41, 0.95);
  z-index: 20;
  box-shadow: 0 0 50px rgba(255, 51, 102, 0.3);
}

.gameover-screen h1 {
    font-size: 2.5rem;
    margin: 0;
    text-shadow: 0 0 20px #ff3366;
}
.gameover-screen h2 {
    font-size: 1.5rem;
    margin: 1rem 0 3rem 0;
    color: #fff;
}

.shake {
  animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-2px, 0, 0); }
  20%, 80% { transform: translate3d(4px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-8px, 0, 0); }
  40%, 60% { transform: translate3d(8px, 0, 0); }
}

.neon-button {
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
  padding: 0.5rem 1.5rem;
  font-size: 1.2rem;
  cursor: pointer;
  text-transform: uppercase;
  font-weight: bold;
  border-radius: 50px;
  transition: all 0.3s ease;
  box-shadow: 0 0 10px var(--primary-color);
  font-family: inherit;
}
.neon-button:hover {
  background: var(--primary-color);
  color: #000;
  box-shadow: 0 0 30px var(--primary-color);
}

.pause-screen {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 1.5rem;
  text-align: center;
  border-radius: 20px;
  border: 2px solid var(--primary-color);
  background: rgba(18, 18, 18, 0.95);
  z-index: 20;
}
.pause-screen h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: var(--primary-color);
}
</style>
