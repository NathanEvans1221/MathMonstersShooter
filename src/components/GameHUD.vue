<script setup>
defineProps({
  score: Number,
  lives: Number
})
</script>

<template>
  <div class="hud">
    <div class="score">{{ $t('score') }} <span class="val">{{ score }}</span></div>
    <div class="lives">
      {{ $t('lives') }} 
      <span v-for="n in lives" :key="n" class="heart">❤️</span>
    </div>
  </div>
</template>

<style scoped>
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

.score {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary-color);
  /* No absolute positioning needed anymore */
}

.lives {
  font-size: 1.5rem;
  font-weight: bold;
  color: #ff3366;
  /* No absolute positioning needed anymore */
}

.val {
  color: #fff;
}

.heart {
  margin-left: 5px;
}
</style>
