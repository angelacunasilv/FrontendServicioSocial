<script setup lang="ts">
withDefaults(defineProps<{ title: string; text?: string; icon?: string }>(), { icon: '$document' });
</script>
<template>
  <div class="empty-state"><v-icon :icon="icon" size="36" aria-hidden="true" /><h2>{{ title }}</h2><p v-if="text">{{ text }}</p><slot /></div>
</template>
