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
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  font-size: 1.5rem;
  font-weight: bold;
  pointer-events: none;
  z-index: 5;
}

.val {
  color: #fff;
}

.score {
  color: var(--primary-color);
}

.lives {
  color: #ff3366;
}

.heart {
  margin-left: 5px;
}
</style>
