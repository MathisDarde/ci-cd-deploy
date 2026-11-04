<script setup lang="ts">
import { WISHLIST_LIMIT } from '@pokewishlist/shared'

const { t } = useI18n()

useSeoMeta({
  title: () => t('home.seoTitle'),
  ogTitle: () => t('home.seoTitle'),
  description: () => t('app.description'),
  ogDescription: () => t('app.description'),
})
</script>

<template>
  <div>
    <p class="intro">{{ t('home.intro', { limit: WISHLIST_LIMIT }) }}</p>
    <!-- The full Pokédex is fetched and filtered in the browser; Pokémon pages are the
         server-rendered, indexable part of the site. -->
    <ClientOnly>
      <CatalogView :title="t('home.title')" />
      <template #fallback>
        <h1 class="fallback-title">{{ t('home.title') }}</h1>
        <p class="message" aria-busy="true">{{ t('catalog.loading') }}</p>
      </template>
    </ClientOnly>
  </div>
</template>

<style scoped>
.intro {
  margin: 0 0 0.5rem;
  color: var(--muted);
}
.fallback-title {
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 800;
}
</style>
