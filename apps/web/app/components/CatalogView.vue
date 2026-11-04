<script setup lang="ts">
import { applyCatalogFilters } from '~/utils/catalog'

const PAGE_SIZE = 48

defineProps<{ title: string }>()

const { t, locale } = useI18n()
const { pokemon, status, retry } = useCatalog()
const { filters, hasActiveFilters, resetFilters } = useCatalogFilters()

const generations = computed(() =>
  [...new Set(pokemon.value.map(p => p.generation))].sort((a, b) => a - b),
)
const results = computed(() => applyCatalogFilters(pokemon.value, filters, locale.value))

// Kept across navigation so "back" from a card can restore the scroll position.
const visibleCount = useState('catalog-visible', () => PAGE_SIZE)
const visible = computed(() => results.value.slice(0, visibleCount.value))
const hasMore = computed(() => visibleCount.value < results.value.length)
watch(filters, () => {
  visibleCount.value = PAGE_SIZE
})

function showMore() {
  visibleCount.value += PAGE_SIZE
}

const sentinel = useTemplateRef<HTMLElement>('sentinel')
let observer: IntersectionObserver | undefined

function armObserver() {
  observer?.disconnect()
  if (sentinel.value) observer?.observe(sentinel.value)
}

onMounted(() => {
  observer = new IntersectionObserver(
    entries => {
      if (entries.some(entry => entry.isIntersecting)) showMore()
    },
    { rootMargin: '800px' },
  )
  armObserver()
})
onBeforeUnmount(() => observer?.disconnect())

// The observer only fires on changes, so it is re-armed after each batch in case
// the sentinel is still on screen.
watch([sentinel, visibleCount], armObserver, { flush: 'post' })
</script>

<template>
  <div>
    <div class="catalog-head">
      <h1>{{ title }}</h1>
      <p v-if="status === 'ready'" class="catalog-head__count" role="status">
        {{ t('catalog.count', results.length) }}
        <template v-if="results.length !== pokemon.length">
          {{ t('catalog.outOf', { total: pokemon.length }) }}
        </template>
      </p>
    </div>

    <div v-if="status === 'error'" class="message" role="alert">
      <h2>{{ t('catalog.errorTitle') }}</h2>
      <p>{{ t('catalog.errorText') }}</p>
      <button type="button" class="btn btn--primary" @click="retry()">
        {{ t('catalog.retry') }}
      </button>
    </div>

    <template v-else>
      <CatalogToolbar
        :filters="filters"
        :generations="generations"
        :has-active-filters="hasActiveFilters"
        @reset="resetFilters"
        @update="Object.assign(filters, $event)"
      />

      <div
        v-if="status !== 'ready'"
        class="grid"
        aria-busy="true"
        :aria-label="t('catalog.loading')"
      >
        <div v-for="n in 12" :key="n" class="skeleton" />
      </div>

      <div v-else-if="!results.length" class="message">
        <h2>{{ t('catalog.emptyTitle') }}</h2>
        <p>{{ t('catalog.emptyText') }}</p>
        <button type="button" class="btn" @click="resetFilters">{{ t('catalog.reset') }}</button>
      </div>

      <template v-else>
        <div class="grid">
          <PokemonCard v-for="p in visible" :key="p.id" :pokemon="p" :total="pokemon.length" />
        </div>
        <div v-if="hasMore" ref="sentinel" class="more">
          <button type="button" class="btn" @click="showMore">{{ t('catalog.more') }}</button>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.catalog-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  margin-bottom: 1rem;
}
.catalog-head h1 {
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 800;
}
.catalog-head__count {
  margin: 0;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 232px), 1fr));
  gap: clamp(0.9rem, 2vw, 1.5rem);
}
.skeleton {
  aspect-ratio: 63 / 88;
  border-radius: 14px;
  background: var(--surface-2);
  animation: pulse 1.2s ease-in-out infinite alternate;
}
@keyframes pulse {
  to {
    opacity: 0.45;
  }
}
@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
}
.more {
  display: flex;
  justify-content: center;
  padding-block: 2rem;
}
</style>
