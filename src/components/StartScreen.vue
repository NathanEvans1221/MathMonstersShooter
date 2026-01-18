<script setup>
import { useI18n } from 'vue-i18n'
import { TTSManager } from '../logic/TTSManager.js'

defineEmits(['start'])
const { locale, t } = useI18n()

const speak = (text) => {
    TTSManager.speak(text, locale.value)
}

const toggleLang = () => {
    locale.value = locale.value === 'zh' ? 'en' : 'zh';
    speak(locale.value === 'zh' ? '切換為中文' : 'Switched to English');
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
    <p>{{ $t('desc') }}</p>
    <button class="neon-button" @click="$emit('start')">{{ $t('start') }}</button>
  </div>
</template>

<style scoped>
.start-screen {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 1.5rem; /* Reduced padding */
  text-align: center;
  border-radius: 20px;
  border: 2px solid var(--primary-color);
  background: rgba(18, 18, 18, 0.95);
  z-index: 10;
  width: 85%; /* Slightly smaller width */
  max-width: 400px; /* Reduced max-width */
}

h1 {
  font-size: 1.8rem; /* Reduced font size */
  margin: 0;
  color: var(--primary-color);
  letter-spacing: 2px;
}
h2 {
  font-size: 1.6rem;
  margin: 0 0 2rem 0;
  color: var(--secondary-color);
  letter-spacing: 4px;
}
p {
  font-size: 1.1rem;
  margin-bottom: 1.7rem;
  color: #aaa;
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
</style>
