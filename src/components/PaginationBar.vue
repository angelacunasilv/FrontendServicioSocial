<script setup lang="ts">
const page = defineModel<number>({ required: true });
defineProps<{ total: number; limit: number; busy?: boolean }>();
</script>
<template>
  <div class="pagination-bar">
    <span>{{ total }} {{ total === 1 ? 'registro' : 'registros' }} en total</span>
    <v-pagination v-if="total > limit" v-model="page" :length="Math.ceil(total / limit)" :total-visible="4"
      :disabled="busy" density="comfortable" rounded="sm" aria-label="Páginas de resultados" />
  </div>
</template>
