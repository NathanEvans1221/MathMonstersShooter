<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { GameEngine } from '../logic/GameEngine.js'

/**
 * 遊戲畫布組件
 * 負責將 Vue 的狀態與原生 Canvas 遊戲引擎 (GameEngine) 進行橋接
 */
const props = defineProps({
  active: Boolean // 遊戲是否正在運行（非開始畫面或暫停狀態）
})

const emit = defineEmits(['score', 'lives', 'gameover', 'options', 'wrong', 'correct'])

const canvasRef = ref(null) // HTML Canvas 元素的引用
let engine = null // GameEngine 實體

onMounted(() => {
  if (canvasRef.value) {
    /**
     * 定義來自引擎的回調函數，將引擎狀態發送（Emit）回 Vue 管理
     */
    const callbacks = {
      onScore: (s) => emit('score', s), // 分數更新
      onLives: (l) => emit('lives', l), // 生命更新
      onGameOver: (s, w) => emit('gameover', s, w), // 遊戲結束(s:分數, w:是否勝利)
      onOptions: (opts) => emit('options', opts), // 選項按鈕更新
      onWrongAnswer: () => emit('wrong'), // 答錯通知
      onCorrectAnswer: () => emit('correct') // 答對通知
    }
    
    // 初始化引擎
    engine = new GameEngine(canvasRef.value, callbacks)
    engine.init()
    
    // 初始化解析度設定
    engine.resize(canvasRef.value.clientWidth, canvasRef.value.clientHeight)
    
    // 監聽畫布尺寸變化（如旋轉螢幕或調整視窗），確保遊戲畫面不失真
    const resizeObserver = new ResizeObserver(() => {
        if (canvasRef.value) {
            engine.resize(canvasRef.value.clientWidth, canvasRef.value.clientHeight)
        }
    })
    resizeObserver.observe(canvasRef.value)
  }
})

/**
 * 監控 active 屬性，連動引擎的暫停與恢復
 */
watch(() => props.active, (newVal) => {
  if (newVal && engine) {
    // 給予微小延遲確保 Canvas 容器尺寸已穩定
    setTimeout(() => {
        engine.resize(canvasRef.value.clientWidth, canvasRef.value.clientHeight)
        engine.resume()
    }, 100)
  } else if (!newVal && engine) {
    engine.setPaused(true)
  }
})

/**
 * 對外公開的方法：處理答案輸入
 */
const handleAnswer = (val) => {
    if (engine) engine.handleAnswer(val)
}

/**
 * 對外公開的方法：重新開始遊戲邏輯
 */
const restartGame = () => {
    if(engine) {
         engine.resize(canvasRef.value.clientWidth, canvasRef.value.clientHeight)
         engine.start()
    }
}

/**
 * 對外公開的方法：外部強制控制暫停
 */
const setPaused = (val) => {
    if (engine) engine.setPaused(val)
}

// 暴露介面供 App.vue 使用 ref 調用
defineExpose({ handleAnswer, setPaused, restartGame })
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
