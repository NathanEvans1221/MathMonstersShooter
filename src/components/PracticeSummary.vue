<script setup>
import { useI18n } from 'vue-i18n'
defineProps({ summary: { type: Object, required: true } })
const { t } = useI18n()
</script>

<template>
    <section class="practice-summary">
        <p>{{ t('practice_correct', { count: summary.correctCount, total: summary.total }) }}</p>
        <p>{{ t('practice_accuracy', { percent: summary.firstAccuracy }) }}</p>
        <h3>{{ t('practice_review') }}</h3>
        <ul v-if="summary.review.length">
            <li v-for="(problem, index) in summary.review" :key="index">
                {{ problem.equation }} {{ t('review_answer', { answer: problem.answer }) }}
            </li>
        </ul>
        <p v-else>{{ t('practice_perfect') }}</p>
    </section>
</template>

<style scoped>
.practice-summary {
    width: min(90vw, 28rem);
    max-height: 45dvh;
    overflow-y: auto;
    font-family: system-ui, sans-serif;
    font-size: 1rem;
    margin-bottom: 1rem;
}
ul {
    text-align: left;
    padding-left: 1.5rem;
    line-height: 1.7;
}
</style>
