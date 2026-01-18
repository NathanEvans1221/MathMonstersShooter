<script setup>
defineEmits(['start'])
</script>

<template>
  <div class="start-screen glass">
    <div class="lang-switch">
        <button @click="$i18n.locale = $i18n.locale === 'zh' ? 'en' : 'zh'">
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
  padding: 3rem;
  text-align: center;
  border-radius: 20px;
  border: 2px solid var(--primary-color);
  background: rgba(18, 18, 18, 0.95);
  z-index: 10;
}

h1 {
  font-size: 3rem;
  margin: 0;
  color: var(--primary-color);
  letter-spacing: 2px;
}
h2 {
  font-size: 2.5rem;
  margin: 0 0 2rem 0;
  color: var(--secondary-color);
  letter-spacing: 4px;
}
p {
  font-size: 1.2rem;
  margin-bottom: 3rem;
  color: #aaa;
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
