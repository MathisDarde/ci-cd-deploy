<script setup lang="ts">
import { fetchPokemon } from '~/utils/pokeapi'
import { formatNumber, typeColor } from '~/utils/display'

const MAX_BASE_STAT = 255

const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const { ids, items, like } = useWishlist()

const name = computed(() => String(route.params.name).toLowerCase())

// Fetched on the server: the HTML already contains the Pokémon (SSR and SSG).
const { data: pokemon, error } = await useAsyncData(
  () => `pokemon:${name.value}:${locale.value}`,
  () => fetchPokemon(name.value, locale.value),
)

if (!error.value && !pokemon.value) {
  throw createError({ statusCode: 404, statusMessage: 'Pokémon not found', fatal: true })
}

const inWishlist = computed(() => (pokemon.value ? ids.value.has(pokemon.value.id) : false))
const likes = computed(() => items.value.find(item => item.id === pokemon.value?.id)?.likes ?? 0)

const statRows = computed(() => {
  const stats = pokemon.value?.stats
  if (!stats) return []
  return (['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const).map(
    key => ({ key, label: t(`stats.${key}`), value: stats[key] }),
  )
})

const numberFormat = computed(
  () => new Intl.NumberFormat(locale.value, { maximumFractionDigits: 1 }),
)
const frameStyle = computed(() => ({
  '--type-a': typeColor(pokemon.value?.types[0]),
  '--type-b': typeColor(pokemon.value?.types[1] ?? pokemon.value?.types[0]),
}))

const description = computed(() =>
  pokemon.value
    ? (pokemon.value.description ??
      t('pokemon.seoDescription', { name: pokemon.value.displayName }))
    : '',
)

useSeoMeta({
  title: () => pokemon.value?.displayName ?? '',
  ogTitle: () => pokemon.value?.displayName ?? '',
  description,
  ogDescription: description,
  ogImage: () => pokemon.value?.artwork,
  ogUrl: () => `${config.public.siteUrl.replace(/\/$/, '')}${route.path}`,
})
</script>

<template>
  <div v-if="error" class="message" role="alert">
    <h2>{{ t('pokemon.loadError') }}</h2>
    <NuxtLink :to="localePath('/')" class="btn btn--primary">{{ t('pokemon.back') }}</NuxtLink>
  </div>

  <article v-else-if="pokemon" class="detail" :style="frameStyle" data-testid="pokemon-detail">
    <div class="detail__art">
      <img
        :src="pokemon.artwork"
        :alt="pokemon.displayName"
        width="475"
        height="475"
        fetchpriority="high"
      />
    </div>

    <div class="detail__info">
      <header>
        <p class="eyebrow">{{ t('pokemon.number', { number: formatNumber(pokemon.id) }) }}</p>
        <h1>{{ pokemon.displayName }}</h1>
        <p v-if="pokemon.genus" class="genus">{{ pokemon.genus }}</p>
      </header>

      <div class="types">
        <TypeBadge v-for="type in pokemon.types" :key="type" :type="type" />
      </div>

      <p v-if="pokemon.description" class="description">{{ pokemon.description }}</p>

      <div class="actions">
        <ClientOnly>
          <WishlistButton
            :id="pokemon.id"
            :name="pokemon.name"
            :display-name="pokemon.displayName"
          />
          <button
            v-if="inWishlist"
            type="button"
            class="btn"
            :aria-label="t('wishlist.like', { name: pokemon.displayName })"
            data-testid="like"
            @click="like(pokemon.id)"
          >
            ♥ <span data-testid="likes">{{ t('wishlist.likes', likes) }}</span>
          </button>
        </ClientOnly>
      </div>

      <dl class="facts">
        <div>
          <dt>{{ t('pokemon.height') }}</dt>
          <dd>{{ numberFormat.format(pokemon.height) }} m</dd>
        </div>
        <div>
          <dt>{{ t('pokemon.weight') }}</dt>
          <dd>{{ numberFormat.format(pokemon.weight) }} kg</dd>
        </div>
        <div>
          <dt>{{ t('pokemon.abilities') }}</dt>
          <dd>{{ pokemon.abilities.join(', ') }}</dd>
        </div>
      </dl>

      <section>
        <h2>{{ t('pokemon.baseStats') }}</h2>
        <dl class="stats">
          <div v-for="row in statRows" :key="row.key" class="stat">
            <dt>{{ row.label }}</dt>
            <dd>
              <span class="stat__value">{{ row.value }}</span>
              <span class="stat__bar" aria-hidden="true">
                <span :style="{ width: `${(row.value / MAX_BASE_STAT) * 100}%` }" />
              </span>
            </dd>
          </div>
        </dl>
      </section>

      <NuxtLink :to="localePath('/')" class="back">← {{ t('pokemon.back') }}</NuxtLink>
    </div>
  </article>
</template>

<style scoped>
.detail {
  display: grid;
  grid-template-columns: minmax(260px, 420px) minmax(0, 1fr);
  gap: clamp(1.5rem, 5vw, 4rem);
  align-items: start;
}
@media (max-width: 760px) {
  .detail {
    grid-template-columns: 1fr;
  }
}
.detail__art {
  position: sticky;
  top: 5rem;
  padding: 1.5rem;
  border-radius: 18px;
  background: linear-gradient(145deg, var(--type-a), var(--type-b));
}
.detail__art img {
  display: block;
  width: 100%;
  height: auto;
  filter: drop-shadow(0 10px 18px rgb(0 0 0 / 0.35));
}
.detail__info {
  display: grid;
  gap: 1.5rem;
  min-width: 0;
}
.eyebrow {
  margin: 0 0 0.25rem;
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
h1 {
  font-size: clamp(2.2rem, 6vw, 3.5rem);
  font-weight: 800;
}
h2 {
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
}
.genus {
  margin: 0.25rem 0 0;
  color: var(--accent);
  font-weight: 600;
}
.types {
  display: flex;
  gap: 0.5rem;
}
.description {
  max-width: 60ch;
  margin: 0;
  font-size: 1.1rem;
}
.actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 42px;
}
.facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin: 0;
}
.facts dt,
.stat dt {
  color: var(--muted);
  font-size: 0.85rem;
  font-weight: 600;
}
.facts dd {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}
.stats {
  display: grid;
  gap: 0.5rem;
  margin: 0;
}
.stat {
  display: grid;
  grid-template-columns: 8rem 1fr;
  align-items: center;
  gap: 1rem;
}
.stat dd {
  display: grid;
  grid-template-columns: 3ch 1fr;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
}
.stat__value {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: right;
}
.stat__bar {
  height: 8px;
  overflow: hidden;
  border-radius: 99px;
  background: var(--surface-2);
}
.stat__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
}
.back {
  justify-self: start;
  font-weight: 600;
}
</style>
