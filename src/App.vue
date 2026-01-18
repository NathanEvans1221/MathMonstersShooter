<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameCanvas from './components/GameCanvas.vue'
import GameHUD from './components/GameHUD.vue'
import AnswerPanel from './components/AnswerPanel.vue'
import StartScreen from './components/StartScreen.vue'
import { TTSManager } from './logic/TTSManager.js'

const { t, locale } = useI18n()
const gameState = ref('start') // start, playing, gameover
const score = ref(0)
const lives = ref(3)
const currentOptions = ref([])
const gameCanvas = ref(null)

const speak = (key) => {
    TTSManager.speak(t(key), locale.value)
}

const startGame = () => {
    gameState.value = 'playing'
    score.value = 0
    lives.value = 3
    currentOptions.value = []
}

// ... (keep existing methods)

const onStartClick = () => {
    speak('start')
    startGame()
}

const onResumeClick = () => {
    speak('resume')
    resumeGame()
}

const onExitClick = () => {
    speak('exit')
    gameState.value = 'start'
}

const onRetryClick = () => {
    speak('retry')
    startGame()
}

// ... 

const isWin = ref(false)

const onScore = (val) => score.value = val
const onLives = (val) => lives.value = val
const onOptions = (opts) => currentOptions.value = opts
const onGameOver = (finalScore, winStatus = false) => {
    score.value = finalScore
    isWin.value = winStatus
    gameState.value = 'gameover'
    
    if (winStatus) {
        TTSManager.speak(t('you_win'), locale.value)
    } else {
        TTSManager.speak(t('game_over'), locale.value)
    }
}
const onWrong = () => {
    const el = document.getElementById('app-container')
    if(el) {
        el.classList.add('shake')
        setTimeout(() => el.classList.remove('shake'), 300)
    }
}

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
