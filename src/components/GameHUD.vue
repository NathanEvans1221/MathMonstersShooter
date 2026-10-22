<script setup>
import { computed, toRef } from 'vue'
import { getProgress } from '../logic/Progress.js'
import { useI18n } from 'vue-i18n'
import { TTSManager } from '../logic/TTSManager.js'
import { preferences } from '../logic/Preferences.js'

/**
 * 遊戲抬頭顯示器 (HUD)
 * 負責在遊戲畫面上方疊加 UI，顯示分數、生命值、靜音與暫停按鈕
 */
const props = defineProps({
  targetScore: Number,
  practiceProgress: Object,
  score: Number, // 當前分數
  lives: Number  // 剩餘生命
})

const emit = defineEmits(['pause']) // 發送暫停事件
const { t, locale } = useI18n()
const isMuted = toRef(preferences, 'muted')
const progress = computed(() => props.practiceProgress
    ? getProgress(props.practiceProgress.completed * 10, props.practiceProgress.total * 10)
    : getProgress(props.score, props.targetScore))

/**
 * 切換靜音狀態 (同步控制 BGM 與 TTS)
 */
const toggleMute = () => {
    isMuted.value = !isMuted.value;
}

/**
 * 處理暫停按鈕點擊
 */
const onPauseClick = () => {
    TTSManager.speak(t('paused'), locale.value)
    emit('pause')
}
</script>


<template>
  <div class="hud">
    <div class="score-row">
        <button class="mute-btn" :aria-label="t(isMuted ? 'unmute' : 'mute')" @click="toggleMute">
            {{ isMuted ? '🔇' : '🔊' }}
        </button>
        <div class="score">{{ $t('score') }} <span class="val">{{ score }}</span></div>
    </div>

    <div class="mission-progress">
        <progress :value="progress.percent" max="100" :aria-label="t('mission_progress')" />
        <span v-if="practiceProgress">{{ t('practice_progress', practiceProgress) }}</span>
        <span v-else>{{ t('remaining_monsters', { count: progress.remaining }) }}</span>
    </div>
    <div class="lives-container">
        <button class="pause-btn" :aria-label="t('paused')" @click="onPauseClick">⏸</button>
        <div v-if="!practiceProgress" class="lives">
        {{ $t('lives') }}
        <span v-for="n in lives" :key="n" class="heart">❤️</span>
        </div>
    </div>
  </div>
</template>

<style scoped>
.mission-progress {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    max-width: 95%;
}
.mission-progress progress {
    width: clamp(4rem, 20vw, 8rem);
    accent-color: var(--primary-color);
}
.hud {
  position: absolute;
  top: 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  z-index: 5;
  gap: 5px;
}

.score-row {
  display: flex;
  align-items: center;
  gap: 15px;
  pointer-events: auto;
}

.mute-btn {
    background: transparent;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    line-height: 1;
    padding: 5px;
}

.score {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary-color);
}

.lives-container {
    display: flex;
    align-items: center;
    gap: 15px; /* Space between pause button and lives text */
}

.lives {
  font-size: 1.5rem;
  font-weight: bold;
  color: #ff3366;
}

.val {
  color: #fff;
}

.heart {
  margin-left: 5px;
}

.pause-btn {
    pointer-events: auto;
    background: transparent;
    border: 2px solid var(--primary-color);
    color: var(--primary-color);
    font-size: 1.2rem;
    width: 45px;
    height: 45px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.2s;
    /* Removed absolute positioning */
}
.pause-btn:hover {
    background: var(--primary-color);
    color: #000;
}
</style>
