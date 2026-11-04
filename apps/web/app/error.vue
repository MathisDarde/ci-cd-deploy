<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const { t } = useI18n()
const localePath = useLocalePath()

const notFound = computed(() => props.error.statusCode === 404)

useSeoMeta({
  title: () => (notFound.value ? t('error.notFoundTitle') : t('error.genericTitle')),
  robots: 'noindex',
})
</script>

<template>
  <main class="message" role="alert">
    <p class="code">{{ error.statusCode }}</p>
    <h1>{{ notFound ? t('error.notFoundTitle') : t('error.genericTitle') }}</h1>
    <p>{{ notFound ? t('error.notFoundText') : t('error.genericText') }}</p>
    <button
      type="button"
      class="btn btn--primary"
      @click="clearError({ redirect: localePath('/') })"
    >
      {{ t('error.home') }}
    </button>
  </main>
</template>

<style scoped>
.code {
  margin: 0;
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 4rem;
  font-weight: 800;
}
h1 {
  margin-bottom: 0.5rem;
}
</style>
