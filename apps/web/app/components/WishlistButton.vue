<script setup lang="ts">
const props = defineProps<{
  id: number
  /** PokéAPI slug */
  name: string
  displayName: string
}>()

const { t } = useI18n()
const { ids, isFull, add, remove } = useWishlist()
const active = computed(() => ids.value.has(props.id))
const busy = ref(false)

async function toggle() {
  busy.value = true
  try {
    if (active.value) await remove(props.id, props.displayName)
    // Still clickable when the team is full: the API explains why it refuses.
    else await add({ id: props.id, name: props.name, displayName: props.displayName })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <button
    type="button"
    class="favorite"
    :class="{ 'favorite--active': active, 'favorite--full': isFull && !active }"
    :aria-pressed="active"
    :aria-busy="busy"
    :aria-label="
      active
        ? t('wishlist.remove', { name: displayName })
        : t('wishlist.add', { name: displayName })
    "
    :title="isFull && !active ? t('wishlist.full') : undefined"
    :disabled="busy"
    @click="toggle"
  >
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M12 20.5s-8-4.900-8-11A4.500 4.500 0 0 1 12 6.600 4.500 4.500 0 0 1 20 9.500c0 6.100-8 11-8 11Z"
      />
    </svg>
  </button>
</template>

<style scoped>
.favorite {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: rgb(255 255 255 / 0.92);
  box-shadow: 0 1px 4px rgb(0 0 0 / 0.3);
  color: #4a4654;
  cursor: pointer;
  transition: transform 0.15s;
}
.favorite:hover {
  transform: scale(1.1);
}
.favorite:active {
  transform: scale(0.92);
}
.favorite path {
  fill: transparent;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linejoin: round;
}
.favorite--active {
  color: #d9263f;
}
.favorite--active path {
  fill: currentColor;
}
.favorite--full {
  opacity: 0.6;
}
.favorite:disabled {
  cursor: progress;
}
</style>
