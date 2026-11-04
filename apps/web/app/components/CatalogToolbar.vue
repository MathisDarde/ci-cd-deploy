<script setup lang="ts">
import {
  MAX_SELECTED_TYPES,
  SORT_OPTIONS,
  type CatalogFilters,
  type SortKey,
} from '~/utils/catalog'
import { POKEMON_TYPES, RARITIES, generationLabel } from '~/utils/display'

const props = defineProps<{
  filters: CatalogFilters
  generations: number[]
  hasActiveFilters: boolean
}>()
const emit = defineEmits<{
  reset: []
  update: [changes: Partial<CatalogFilters>]
}>()

const { t } = useI18n()

function field<K extends keyof CatalogFilters>(key: K) {
  return computed({
    get: () => props.filters[key],
    set: value => emit('update', { [key]: value }),
  })
}

const q = field('q')
const generation = field('generation')
const rarity = field('rarity')

function onSortChange(event: Event) {
  const sort = (event.target as HTMLSelectElement).value as SortKey
  emit('update', { sort, dir: SORT_OPTIONS[sort].defaultDir })
}

function toggleDirection() {
  emit('update', { dir: props.filters.dir === 'asc' ? 'desc' : 'asc' })
}

function toggleType(type: string) {
  const { types } = props.filters
  emit('update', {
    types: types.includes(type) ? types.filter(t => t !== type) : [...types, type],
  })
}

const typesFull = computed(() => props.filters.types.length >= MAX_SELECTED_TYPES)
</script>

<template>
  <section class="toolbar" :aria-label="t('toolbar.label')">
    <div class="toolbar__row">
      <label class="field field--search">
        <span class="field__label">{{ t('toolbar.search') }}</span>
        <input
          v-model="q"
          type="search"
          :placeholder="t('toolbar.searchPlaceholder')"
          autocomplete="off"
        />
      </label>

      <label class="field">
        <span class="field__label">{{ t('toolbar.generation') }}</span>
        <select v-model="generation">
          <option :value="null">{{ t('toolbar.all') }}</option>
          <option v-for="option in generations" :key="option" :value="option">
            {{ t('toolbar.generationOption', { gen: generationLabel(option) }) }}
          </option>
        </select>
      </label>

      <label class="field">
        <span class="field__label">{{ t('toolbar.rarity') }}</span>
        <select v-model="rarity">
          <option :value="null">{{ t('toolbar.all') }}</option>
          <option v-for="key in RARITIES" :key="key" :value="key">{{ t(`rarity.${key}`) }}</option>
        </select>
      </label>

      <div class="field field--sort">
        <label class="field__label" for="catalog-sort">{{ t('toolbar.sortBy') }}</label>
        <div class="sort">
          <select id="catalog-sort" :value="filters.sort" @change="onSortChange">
            <option v-for="(_option, key) in SORT_OPTIONS" :key="key" :value="key">
              {{ t(`sort.${key}`) }}
            </option>
          </select>
          <button type="button" class="sort__dir" @click="toggleDirection">
            {{ filters.dir === 'asc' ? t('toolbar.ascending') : t('toolbar.descending') }}
          </button>
        </div>
      </div>
    </div>

    <fieldset class="types">
      <legend class="field__label">{{ t('toolbar.types') }}</legend>
      <button
        v-for="(meta, type) in POKEMON_TYPES"
        :key="type"
        type="button"
        class="type-chip"
        :class="{ 'type-chip--on': filters.types.includes(type) }"
        :style="{ '--chip': meta.color, '--chip-ink': meta.ink }"
        :aria-pressed="filters.types.includes(type)"
        :disabled="typesFull && !filters.types.includes(type)"
        @click="toggleType(type)"
      >
        {{ t(`types.${type}`) }}
      </button>
      <button v-if="hasActiveFilters" type="button" class="types__reset" @click="$emit('reset')">
        {{ t('toolbar.clearAll') }}
      </button>
    </fieldset>
  </section>
</template>

<style scoped>
.toolbar {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.25rem;
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
}
.toolbar__row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.field {
  display: grid;
  flex: 1 1 150px;
  gap: 0.25rem;
  align-content: start;
}
.field--search {
  flex: 2 1 240px;
}
.field--sort {
  flex: 2 1 300px;
}
.field__label {
  padding: 0;
  color: var(--muted);
  font-size: 0.8rem;
  font-weight: 600;
}
input,
select,
.sort__dir {
  width: 100%;
  min-height: 42px;
  padding: 0.4rem 0.7rem;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface-2);
}
.sort {
  display: flex;
  gap: 0.4rem;
}
.sort select {
  flex: 1;
  min-width: 0;
}
.sort__dir {
  flex: none;
  width: auto;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}
.types {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
.types legend {
  margin-bottom: 0.35rem;
}
.type-chip {
  min-height: 34px;
  padding: 0.2rem 0.75rem;
  border: 1px solid var(--chip);
  border-radius: 99px;
  background: transparent;
  color: var(--text);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.type-chip:hover:not(:disabled) {
  background: color-mix(in srgb, var(--chip) 25%, transparent);
}
.type-chip--on,
.type-chip--on:hover:not(:disabled) {
  background: var(--chip);
  color: var(--chip-ink);
}
.type-chip:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
/* Out of flow so that appearing doesn't push the cards down. */
.types__reset {
  position: absolute;
  top: -1.9rem;
  right: 0;
  min-height: 34px;
  padding: 0.2rem 0.5rem;
  border: 0;
  background: none;
  color: var(--accent);
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}
</style>
