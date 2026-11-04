<script setup lang="ts">
import { NuxtLink } from '#components'
import type { CatalogPokemon } from '~/utils/catalog-api'
import { artworkUrl, formatNumber, generationLabel, typeColor } from '~/utils/display'

const props = withDefaults(
  defineProps<{
    pokemon: CatalogPokemon
    total?: number
    linked?: boolean
  }>(),
  { total: undefined, linked: true },
)

const { t } = useI18n()
const localePath = useLocalePath()

const imageFailed = ref(false)
watch(
  () => props.pokemon.id,
  () => {
    imageFailed.value = false
  },
)

const isRare = computed(() => props.pokemon.rarity !== 'common')
const frameStyle = computed(() => ({
  '--type-a': typeColor(props.pokemon.types[0]),
  '--type-b': typeColor(props.pokemon.types[1] ?? props.pokemon.types[0]),
}))

const tiltEnabled =
  import.meta.client && !window.matchMedia('(prefers-reduced-motion: reduce)').matches

function onPointerMove(event: PointerEvent) {
  if (!tiltEnabled || event.pointerType !== 'mouse') return
  const el = event.currentTarget as HTMLElement
  const box = el.getBoundingClientRect()
  const x = (event.clientX - box.left) / box.width
  const y = (event.clientY - box.top) / box.height
  el.style.setProperty('--rx', `${(0.5 - y) * 14}deg`)
  el.style.setProperty('--ry', `${(x - 0.5) * 14}deg`)
  el.style.setProperty('--mx', `${x * 100}%`)
  el.style.setProperty('--my', `${y * 100}%`)
}

function onPointerLeave(event: PointerEvent) {
  const el = event.currentTarget as HTMLElement
  for (const name of ['--rx', '--ry', '--mx', '--my']) el.style.removeProperty(name)
}
</script>

<template>
  <article
    class="card"
    :class="{ 'card--rare': isRare }"
    :style="frameStyle"
    :data-testid="`card-${pokemon.slug}`"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
  >
    <component
      :is="linked ? NuxtLink : 'div'"
      class="card__body"
      v-bind="linked ? { to: localePath(`/pokemon/${pokemon.slug}`) } : {}"
    >
      <header class="card__head">
        <h3 class="card__name">{{ pokemon.name }}</h3>
        <span class="card__hp"
          ><small>{{ t('stats.hp') }}</small> {{ pokemon.stats.hp }}</span
        >
      </header>

      <div class="card__art">
        <img
          v-if="!imageFailed"
          :src="artworkUrl(pokemon.id)"
          :alt="pokemon.name"
          width="475"
          height="475"
          :loading="linked ? 'lazy' : 'eager'"
          decoding="async"
          @error="imageFailed = true"
        />
        <span v-else class="card__art-missing" aria-hidden="true">?</span>
      </div>

      <div class="card__types">
        <TypeBadge v-for="type in pokemon.types" :key="type" :type="type" />
      </div>

      <dl class="card__stats">
        <div>
          <dt>{{ t('stats.attackShort') }}</dt>
          <dd>{{ pokemon.stats.attack }}</dd>
        </div>
        <div>
          <dt>{{ t('stats.defenseShort') }}</dt>
          <dd>{{ pokemon.stats.defense }}</dd>
        </div>
        <div>
          <dt>{{ t('stats.speedShort') }}</dt>
          <dd>{{ pokemon.stats.speed }}</dd>
        </div>
      </dl>

      <footer class="card__foot">
        <span
          >{{ formatNumber(pokemon.id) }}<template v-if="total">/{{ total }}</template></span
        >
        <span v-if="pokemon.rarity !== 'common'" class="card__rarity"
          >★ {{ t(`rarity.${pokemon.rarity}`) }}</span
        >
        <span>{{ generationLabel(pokemon.generation) }}</span>
      </footer>
    </component>

    <WishlistButton
      :id="pokemon.id"
      class="card__favorite"
      :name="pokemon.slug"
      :display-name="pokemon.name"
    />
    <div v-if="isRare" class="card__holo" aria-hidden="true" />
  </article>
</template>

<style scoped>
.card {
  --rx: 0deg;
  --ry: 0deg;
  --mx: 50%;
  --my: 50%;
  position: relative;
  container-type: inline-size;
  aspect-ratio: 63 / 88;
  padding: 3.5%;
  border-radius: 14px;
  background: linear-gradient(145deg, var(--type-a), var(--type-b));
  box-shadow: 0 6px 16px rgb(0 0 0 / 0.4);
  transform: perspective(900px) rotateX(var(--rx)) rotateY(var(--ry));
  transition:
    transform 0.2s ease-out,
    box-shadow 0.2s;
}
.card:hover {
  box-shadow: 0 14px 30px rgb(0 0 0 / 0.55);
  transition-duration: 0.06s, 0.2s;
}
.card--rare {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}
.card__body {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 3.5cqw 4cqw;
  border-radius: 9px;
  background: #fbf7ec;
  color: #1c1a24;
  font-size: 5.2cqw;
  text-decoration: none;
}
.card__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5em;
}
.card__name {
  min-width: 0;
  overflow: hidden;
  font-size: 1.45em;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card__hp {
  flex: none;
  color: #b3202f;
  font-family: var(--font-display);
  font-size: 1.3em;
  font-weight: 800;
}
.card__hp small {
  font-size: 0.6em;
}
.card__art {
  flex: 1;
  display: grid;
  place-items: center;
  min-height: 0;
  margin-block: 2.5cqw;
  overflow: hidden;
  border-radius: 6px;
  background:
    radial-gradient(circle at 50% 45%, rgb(255 255 255 / 0.75), transparent 65%),
    linear-gradient(145deg, var(--type-a), var(--type-b));
}
.card__art img {
  display: block;
  width: 100%;
  height: 100%;
  padding: 3%;
  object-fit: contain;
  filter: drop-shadow(0 4px 5px rgb(0 0 0 / 0.3));
}
.card__art-missing {
  color: rgb(0 0 0 / 0.35);
  font-family: var(--font-display);
  font-size: 4em;
  font-weight: 800;
}
.card__types {
  display: flex;
  gap: 0.35em;
  min-height: 1.3em;
  font-size: 1.15em;
}
.card__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 2cqw 0;
  border-block: 1px solid #ded7c3;
}
.card__stats div {
  padding-block: 1cqw;
  text-align: center;
}
.card__stats dt {
  color: #6c6757;
  font-size: 0.72em;
  font-weight: 700;
}
.card__stats dd {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.15em;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.card__foot {
  display: flex;
  justify-content: space-between;
  gap: 0.5em;
  color: #6c6757;
  font-size: 0.78em;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.card__rarity {
  color: #8e6a00;
  font-weight: 800;
}
.card__favorite {
  position: absolute;
  top: 15%;
  right: 8%;
}
.card__holo {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    radial-gradient(circle at var(--mx) var(--my), rgb(255 255 255 / 0.4), transparent 45%),
    linear-gradient(
      115deg,
      transparent 25%,
      rgb(255 90 170 / 0.28) 38%,
      rgb(255 225 90 / 0.28) 48%,
      rgb(90 240 200 / 0.28) 58%,
      rgb(100 160 255 / 0.28) 68%,
      transparent 80%
    );
  background-position:
    0 0,
    var(--mx) var(--my);
  background-size:
    100% 100%,
    240% 240%;
  mix-blend-mode: soft-light;
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
}
</style>
