<script setup>
import { ref } from 'vue'
import GameCanvas from './components/GameCanvas.vue'
import GameHUD from './components/GameHUD.vue'
import AnswerPanel from './components/AnswerPanel.vue'
import StartScreen from './components/StartScreen.vue'

const gameState = ref('start') // start, playing, gameover
const score = ref(0)
const lives = ref(3)
const currentOptions = ref([])
const gameCanvas = ref(null)

const startGame = () => {
    gameState.value = 'playing'
    score.value = 0
    lives.value = 3
    currentOptions.value = []
}

const onScore = (val) => score.value = val
const onLives = (val) => lives.value = val
const onOptions = (opts) => currentOptions.value = opts
const onGameOver = (finalScore) => {
    score.value = finalScore
    gameState.value = 'gameover'
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
    
    <StartScreen v-if="gameState === 'start'" @start="startGame" />
    
    <div v-if="gameState === 'playing'">
        <GameHUD :score="score" :lives="lives" />
        <AnswerPanel :options="currentOptions" @answer="handleAnswer" />
    </div>

    <div v-if="gameState === 'gameover'" class="gameover-screen glass">
        <h1 class="neon-text" style="color: #ff3366">{{ $t('game_over') }}</h1>
        <h2>{{ $t('final_score') }} {{ score }}</h2>
        <button class="neon-button" @click="startGame">{{ $t('retry') }}</button>
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
  padding: 3rem;
  text-align: center;
  border-radius: 20px;
  border: 1px solid #ff3366;
  background: rgba(11, 15, 41, 0.95);
  z-index: 20;
  box-shadow: 0 0 50px rgba(255, 51, 102, 0.3);
}

.gameover-screen h1 {
    font-size: 4rem;
    margin: 0;
    text-shadow: 0 0 20px #ff3366;
}
.gameover-screen h2 {
    font-size: 2rem;
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
  padding: 1rem 3rem;
  font-size: 1.5rem;
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
</style>
