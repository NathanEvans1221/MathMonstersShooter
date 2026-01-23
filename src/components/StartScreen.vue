<script setup>
import { useI18n } from 'vue-i18n'
import { TTSManager } from '../logic/TTSManager.js'
import { ref } from 'vue'

/**
 * 遊戲起始畫面組件
 * 提供標題、語言切換、以及開始遊戲的入口點
 */
const emit = defineEmits(['start']) // 發送開始遊戲事件
const { locale, t } = useI18n()
const version = __APP_VERSION__ // 從 Vite 配置中注入的應用程式版本號

const selectedMode = ref('add')
const selectedDifficulty = ref('medium') // default to medium (350) based on PRD

/**
 * 調用語音合成播放文字
 * @param {string} text - 要播放的內容
 */
const speak = (text) => {
    TTSManager.speak(text, locale.value)
}

/**
 * 切換當前語系 (中/英) 並語音提示
 */
const toggleLang = () => {
    locale.value = locale.value === 'zh' ? 'en' : 'zh';
    speak(locale.value === 'zh' ? '切換為中文' : 'Switched to English');
}

const selectMode = (mode) => {
    selectedMode.value = mode;
    speak(t(`modes.${mode}`));
}

const selectDifficulty = (diff) => {
    selectedDifficulty.value = diff;
    speak(t(`difficulties.${diff}`));
}

const onStart = () => {
    emit('start', { 
        mode: selectedMode.value, 
        difficulty: selectedDifficulty.value 
    })
}
</script>


<template>
  <div class="start-screen glass">
    <div class="lang-switch">
        <button @click="toggleLang">
            {{ $i18n.locale === 'zh' ? 'EN' : '中文' }}
        </button>
    </div>
    <h1 class="neon-text">{{ $t('title') }}</h1>
    <h2 class="neon-text">{{ $t('subtitle') }}</h2>
    
    <div class="selection-group">
        <div class="label">{{ $t('mode') }}</div>
        <div class="buttons">
            <button 
                v-for="mode in ['add', 'sub', 'mul']" 
                :key="mode"
                :class="{ active: selectedMode === mode }"
                @click="selectMode(mode)"
            >
                {{ $t(`modes.${mode}`) }}
            </button>
        </div>
    </div>

    <div class="selection-group">
        <div class="label">{{ $t('difficulty') }}</div>
        <div class="buttons">
            <button 
                v-for="diff in ['easy', 'medium', 'hard']" 
                :key="diff"
                :class="{ active: selectedDifficulty === diff }"
                @click="selectDifficulty(diff)"
            >
                {{ $t(`difficulties.${diff}`) }}
            </button>
        </div>
    </div>

    <button class="neon-button start-btn" @click="onStart">{{ $t('start') }}</button>
    <div class="version">v{{ version }}</div>
  </div>
</template>

<style scoped>
.start-screen {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 1.5rem;
  text-align: center;
  border-radius: 20px;
  border: 2px solid var(--primary-color);
  background: rgba(18, 18, 18, 0.95);
  z-index: 10;
  width: 90%;
  max-width: 450px;
}

h1 {
  font-size: 1.8rem;
  margin: 0;
  color: var(--primary-color);
  letter-spacing: 2px;
}
h2 {
  font-size: 1.4rem;
  margin: 0 0 1rem 0;
  color: var(--secondary-color);
  letter-spacing: 4px;
}

.selection-group {
    margin-bottom: 1rem;
    text-align: center;
}

.label {
    color: #aaa;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
}

.buttons {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
}

.buttons button {
    background: transparent;
    border: 1px solid #555;
    color: #888;
    padding: 0.4rem 0.8rem;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.9rem;
}

.buttons button.active {
    background: var(--primary-color);
    color: #0b0f29;
    border-color: var(--primary-color);
    font-weight: bold;
    box-shadow: 0 0 10px rgba(0, 243, 255, 0.4);
}

.neon-button {
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
  padding: 0.6rem 1.7rem;
  font-size: 1.3rem;
  cursor: pointer;
  text-transform: uppercase;
  font-weight: bold;
  border-radius: 50px;
  transition: all 0.3s ease;
  box-shadow: 0 0 10px var(--primary-color);
  font-family: inherit;
  margin-top: 1rem;
}


.neon-button:hover {
  background: var(--primary-color);
  color: #0b0f29;
  box-shadow: 0 0 30px var(--primary-color);
}

.lang-switch {
    position: absolute;
    top: 20px;
    right: 20px;
}
.lang-switch button {
    background: rgba(255,255,255,0.1);
    border: 1px solid var(--primary-color);
    color: var(--primary-color);
    padding: 5px 15px;
    cursor: pointer;
    border-radius: 15px;
}

.version {
    margin-top: 1rem;
    font-size: 1rem;
    color: #888;
    font-family: monospace;
    font-weight: bold;
}
</style>
