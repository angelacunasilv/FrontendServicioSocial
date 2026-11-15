<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { request } from '../lib/api';
const path = defineModel<string | null>({ required: true });
defineProps<{ title?: string }>();
const url = ref('');
const error = ref('');
const busy = ref(false);
const visorDisponible = navigator.pdfViewerEnabled !== false;
let controller: AbortController | undefined;
function release() {
  controller?.abort();
  if (url.value) URL.revokeObjectURL(url.value);
  url.value = '';
}
watch(path, async value => {
  release();
  error.value = '';
  if (!value) return;
  const current = new AbortController();
  controller = current;
  busy.value = true;
  try {
    const blob = await request<Blob>(value, { blob: true, signal: current.signal });
    if (!current.signal.aborted) {
      if (!blob.type.startsWith('application/pdf')) throw new Error('El archivo no se encuentra disponible');
      url.value = URL.createObjectURL(blob);
    }
  } catch (failure) {
    if (!current.signal.aborted) error.value = (failure as Error).message;
  } finally {
    if (!current.signal.aborted) busy.value = false;
  }
});
onBeforeUnmount(release);
</script>
<template>
  <v-dialog aria-label="Vista previa del documento PDF" :model-value="Boolean(path)" max-width="1100" @update:model-value="value => { if (!value) path = null; }">
    <v-card class="preview-card">
      <v-card-title class="dialog-heading"><span>{{ title ?? 'Vista previa del documento' }}</span>
        <v-btn icon="$close" variant="text" aria-label="Cerrar vista previa" @click="path = null" /></v-card-title>
      <v-card-text>
        <v-progress-linear v-if="busy" indeterminate color="primary" aria-label="Cargando PDF" />
        <v-alert v-if="error" type="error" role="alert">{{ error }}</v-alert>
        <template v-if="url"><p v-if="visorDisponible" class="muted mb-3">Puedes descargar o imprimir el archivo desde los controles del visor.</p>
          <v-alert v-else type="info" class="mb-4">Este navegador no tiene visor PDF integrado. Descarga el archivo para abrirlo e imprimirlo.</v-alert>
          <iframe v-if="visorDisponible" :src="url" :title="title ?? 'Documento PDF'" class="pdf-frame" />
          <div class="form-actions">
            <v-btn :href="url" download="documento.pdf" color="primary" prepend-icon="$download">Descargar PDF</v-btn>
            <a :href="url" target="_blank" rel="noopener" class="pdf-fallback">Abrir PDF en otra pestaña</a>
          </div>
        </template>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
