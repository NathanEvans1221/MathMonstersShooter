<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { GameEngine } from '../logic/GameEngine.js'

const emit = defineEmits(['score', 'lives', 'gameover', 'options', 'wrong', 'correct', 'hint', 'practice'])
const canvasRef = ref(null)
let engine = null
let resizeObserver = null
const onFontsChanged = () => {
    engine?.invalidateTextMetrics()
    engine?.draw()
}

onMounted(() => {
    engine = new GameEngine(canvasRef.value, {
        onScore: (s) => emit('score', s),
        onLives: (l) => emit('lives', l),
        onOptions: (opts) => emit('options', opts),
        onHint: (hint) => emit('hint', hint),
        onPracticeProgress: (progress) => emit('practice', progress),
        onGameOver: (s, w, summary) => emit('gameover', s, w, summary),
        onWrongAnswer: () => emit('wrong'),
        onCorrectAnswer: () => emit('correct')
    })
    engine.init()
    const resize = () => engine.resize(canvasRef.value.clientWidth, canvasRef.value.clientHeight)
    resize()
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvasRef.value)
    document.fonts?.addEventListener('loadingdone', onFontsChanged)
    document.fonts?.ready.then(onFontsChanged)
})
onUnmounted(() => {
    resizeObserver?.disconnect()
    document.fonts?.removeEventListener('loadingdone', onFontsChanged)
    engine?.stop()
    engine = null
})

const restartGame = (settings) => engine?.start(settings)
const handleAnswer = (value) => engine?.handleAnswer(value)
const setPaused = (value) => engine?.setPaused(value)
const stop = () => engine?.stop()
defineExpose({ restartGame, handleAnswer, setPaused, stop })
</script>

<template>
    <canvas ref="canvasRef" class="game-canvas"></canvas>
</template>

<style scoped>
.game-canvas {
    width: 100%;
    height: 100%;
    display: block;
}
</style>
