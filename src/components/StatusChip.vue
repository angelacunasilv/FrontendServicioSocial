<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ value: string }>();
const labels: Record<string, string> = {
  PENDIENTE: 'Pendiente de revisión', ACEPTADO: 'Aceptado', RECHAZADO: 'Rechazado', SIN_ENTREGA: 'Sin entrega',
  INSCRITO: 'En proceso', TERMINADO: 'Terminado', ACTIVO: 'Activo', INACTIVO: 'Inactivo',
};
const label = computed(() => labels[props.value] ?? props.value);
</script>
<template>
  <span class="status-chip" :class="'status-' + value.toLowerCase()"><span aria-hidden="true" />{{ label }}</span>
</template>
