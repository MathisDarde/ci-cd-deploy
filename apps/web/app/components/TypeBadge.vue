<script setup lang="ts">
import { POKEMON_TYPES } from '~/utils/display'

const props = defineProps<{ type: string }>()
const meta = computed(() => POKEMON_TYPES[props.type])
const { t, te } = useI18n()
const label = computed(() => (te(`types.${props.type}`) ? t(`types.${props.type}`) : props.type))
</script>

<template>
  <span class="type-badge" :style="{ background: meta?.color, color: meta?.ink }">
    {{ label }}
  </span>
</template>

<style scoped>
.type-badge {
  display: inline-block;
  padding: 0.1em 0.65em;
  border-radius: 99px;
  font-size: 0.72em;
  font-weight: 700;
  white-space: nowrap;
}
</style>
