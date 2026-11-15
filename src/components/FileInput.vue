<script setup lang="ts">
const file = defineModel<File | null>({ default: null });
withDefaults(defineProps<{ error?: string; disabled?: boolean; accept?: string; label?: string; hint?: string }>(), {
  accept: '.pdf,application/pdf', label: 'Archivo PDF *', hint: 'Formato PDF. Tamaño máximo de 10 MiB.',
});
function update(value: File | File[] | null) { file.value = Array.isArray(value) ? value[0] ?? null : value; }
</script>
<template>
  <v-file-input :model-value="file" @update:model-value="update" :label="label" :accept="accept" show-size
    :error-messages="error" :disabled="disabled" :hint="hint" persistent-hint name="archivo" />
</template>
