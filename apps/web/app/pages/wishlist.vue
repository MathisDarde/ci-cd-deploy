<script setup lang="ts">
import { WISHLIST_LIMIT } from '@pokewishlist/shared'
import { artworkUrl, formatNumber } from '~/utils/display'

const { t } = useI18n()
const localePath = useLocalePath()
const { items, status, remove, like } = useWishlist()

const freeSlots = computed(() => Math.max(0, WISHLIST_LIMIT - items.value.length))
const label = (slug: string) =>
  slug
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

useSeoMeta({
  title: () => t('wishlist.title'),
  ogTitle: () => t('wishlist.title'),
  // A personal page: nothing to index.
  robots: 'noindex, follow',
})
</script>

<template>
  <div>
    <header class="head">
      <h1>{{ t('wishlist.title') }}</h1>
      <ClientOnly>
        <p class="head__count" data-testid="wishlist-total">
          {{ t('wishlist.count', { count: items.length, limit: WISHLIST_LIMIT }) }}
        </p>
      </ClientOnly>
    </header>
    <p class="intro">{{ t('wishlist.intro', { limit: WISHLIST_LIMIT }) }}</p>

    <ClientOnly>
      <p v-if="status === 'error'" class="message" role="alert">{{ t('wishlist.loadError') }}</p>
      <p v-else-if="status !== 'ready' && !items.length" class="message" aria-busy="true">
        {{ t('wishlist.loading') }}
      </p>
      <div v-else-if="!items.length" class="message">
        <h2>{{ t('wishlist.empty') }}</h2>
        <NuxtLink :to="localePath('/')" class="btn btn--primary">{{
          t('wishlist.emptyCta')
        }}</NuxtLink>
      </div>

      <ol v-else class="team" data-testid="wishlist">
        <li
          v-for="item in items"
          :key="item.id"
          class="slot"
          :data-testid="`wishlist-item-${item.name}`"
        >
          <NuxtLink :to="localePath(`/pokemon/${item.name}`)" class="slot__link">
            <img
              :src="artworkUrl(item.id)"
              :alt="label(item.name)"
              width="160"
              height="160"
              loading="lazy"
            />
            <span class="slot__number">{{ formatNumber(item.id) }}</span>
            <span class="slot__name">{{ label(item.name) }}</span>
          </NuxtLink>
          <div class="slot__actions">
            <button
              type="button"
              class="btn"
              :aria-label="t('wishlist.like', { name: label(item.name) })"
              data-testid="like"
              @click="like(item.id)"
            >
              ♥ <span data-testid="likes">{{ t('wishlist.likes', item.likes) }}</span>
            </button>
            <button
              type="button"
              class="btn"
              :aria-label="t('wishlist.remove', { name: label(item.name) })"
              @click="remove(item.id, label(item.name))"
            >
              ✕
            </button>
          </div>
        </li>
        <li v-for="n in freeSlots" :key="`free-${n}`" class="slot slot--free" aria-hidden="true">
          {{ t('wishlist.emptySlot') }}
        </li>
      </ol>
    </ClientOnly>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem 1rem;
}
.head h1 {
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 800;
}
.head__count {
  margin: 0;
  color: var(--accent);
  font-size: 1.3rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.intro {
  margin: 0.25rem 0 1.5rem;
  color: var(--muted);
}
.team {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr));
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.slot {
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
}
.slot--free {
  place-items: center;
  min-height: 260px;
  border-style: dashed;
  background: transparent;
  color: var(--muted);
}
.slot__link {
  display: grid;
  justify-items: center;
  color: var(--text);
  text-decoration: none;
}
.slot__link img {
  width: 100%;
  max-width: 160px;
  height: auto;
}
.slot__number {
  color: var(--muted);
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
}
.slot__name {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 700;
}
.slot__actions {
  display: flex;
  gap: 0.5rem;
}
.slot__actions .btn:first-child {
  flex: 1;
}
</style>
