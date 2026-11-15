<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import PageHeading from '../components/PageHeading.vue';
import PdfPreview from '../components/PdfPreview.vue';
import { useForm } from '../composables/useForm';
import { buscarAlumnoSchema } from '../lib/validation';
import { descargar, request } from '../lib/api';
import { configuracion } from '../stores/configuracion';
import { fecha } from '../lib/catalogos';
import { useUiStore } from '../stores/ui';
import type { Respuesta } from '../types';
interface Constancia { folio: string; fechaEmision: string; firmado: boolean; descarga: string; vistaPrevia: string }
const form = useForm(buscarAlumnoSchema, { numeroControl: useRoute().query.numeroControl ?? '' });
const result = ref<Constancia | null>(null);
const generatedFor = ref('');
const preview = ref<string | null>(null);
const busyDownload = ref(false);
watch(() => form.values.numeroControl, () => { result.value = null; });
async function submit() {
  if (form.busy) return;
  const data = form.validate();
  if (!data) return;
  form.busy = true;
  result.value = null;
  try {
    const response = await request<Respuesta<Constancia>>('/constancias', { method: 'POST', body: data });
    result.value = response.datos;
    generatedFor.value = data.numeroControl;
    useUiStore().notificar(response.mensaje ?? 'Constancia de terminación generada con éxito.');
  } catch (failure) { form.serverError(failure); } finally { form.busy = false; }
}
async function download() {
  if (!result.value || busyDownload.value) return;
  busyDownload.value = true;
  try { await descargar(result.value.descarga, 'constancia-' + generatedFor.value + '.pdf'); }
  catch (failure) { useUiStore().notificar((failure as Error).message, 'error'); } finally { busyDownload.value = false; }
}
</script>
<template>
  <PageHeading title="Constancias de terminación" subtitle="Emite la constancia de servicio social de un alumno y descarga su PDF." />
  <div class="two-column-content">
    <section class="panel padded"><h2 class="mb-5">Generar constancia</h2><form novalidate @submit.prevent="submit">
      <v-alert v-if="form.message" type="error" role="alert" class="mb-5">{{ form.message }}</v-alert>
      <v-text-field v-model="form.values.numeroControl" label="Número de control del alumno *" name="numeroControl" maxlength="32"
        :error-messages="form.errors.numeroControl" :disabled="form.busy" />
      <div class="form-actions"><v-btn type="submit" color="primary" prepend-icon="$certificate" :loading="form.busy">Generar constancia</v-btn></div>
    </form></section>
    <aside class="instruction-panel"><v-icon icon="$certificate" color="primary" size="32" /><h2>Antes de emitir</h2>
      <p>El expediente debe contar con carta de aceptación, reportes bimestrales 1, 2 y 3 e informe final aprobados.</p>
      <p v-if="configuracion.horasRequeridas">El alumno debe tener al menos {{ configuracion.horasRequeridas }} horas aprobadas.</p>
      <router-link to="/expedientes">Consultar el expediente del alumno</router-link>
    </aside>
  </div>
  <section v-if="result" class="panel padded certificate-result mt-6" role="status">
    <v-icon icon="$check" color="success" size="38" /><div><h2>Constancia de terminación generada con éxito.</h2>
      <p>Alumno {{ generatedFor }} · Fecha {{ fecha(result.fechaEmision) }}</p><p class="muted">Folio {{ result.folio }}</p>
      <p class="muted mt-2">El PDF incluye el espacio para la firma institucional.</p>
      <div class="form-actions"><v-btn variant="outlined" prepend-icon="$print" @click="preview = result!.vistaPrevia">Ver e imprimir PDF</v-btn>
        <v-btn color="primary" prepend-icon="$download" :loading="busyDownload" @click="download">Descargar constancia</v-btn></div>
    </div>
  </section>
  <PdfPreview v-model="preview" title="Constancia de terminación" />
</template>
