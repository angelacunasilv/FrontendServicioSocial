<script setup lang="ts">
import { onMounted, onScopeDispose, ref } from 'vue';
import { useRoute } from 'vue-router';
import PageHeading from '../components/PageHeading.vue';
import { cargarReporteCompleto, type FilaImpresion } from '../lib/printReport';
import { faltantesSchema } from '../lib/validation';
import { fecha } from '../lib/catalogos';

const route = useRoute();
const rows = ref<FilaImpresion[]>([]);
const busy = ref(true);
const error = ref('');
const reporte = ref('');
const periodo = ref('');
const generado = ref('');
let controller: AbortController | undefined;

async function load() {
  controller?.abort();
  const current = new AbortController();
  controller = current;
  busy.value = true;
  error.value = '';
  rows.value = [];
  const result = faltantesSchema.safeParse({ reporte: route.query.reporte, periodo: route.query.periodo ?? '' });
  if (!result.success) {
    error.value = 'Selecciona un reporte válido desde Reportes de faltantes.';
    busy.value = false;
    return;
  }
  reporte.value = result.data.reporte;
  periodo.value = String(result.data.periodo ?? '');
  try {
    const data = await cargarReporteCompleto(reporte.value, periodo.value, current.signal);
    if (!current.signal.aborted) {
      rows.value = data;
      generado.value = fecha(new Date().toISOString());
    }
  } catch (failure) {
    if (!current.signal.aborted) error.value = (failure as Error).message;
  } finally {
    if (!current.signal.aborted) busy.value = false;
  }
}
function imprimir() { window.print(); }
onMounted(load);
onScopeDispose(() => controller?.abort());
</script>

<template>
  <PageHeading title="Vista de impresión" subtitle="El listado incluye todos los alumnos de la consulta.">
    <v-btn to="/reportes" variant="outlined" prepend-icon="$back">Volver a reportes</v-btn>
    <v-btn color="primary" prepend-icon="$print" :disabled="busy || !rows.length" @click="imprimir">Imprimir reporte</v-btn>
  </PageHeading>
  <v-progress-linear v-if="busy" indeterminate color="primary" aria-label="Preparando reporte para impresión" />
  <v-alert v-if="error" type="error" role="alert">{{ error }}<v-btn variant="text" @click="load">Reintentar</v-btn></v-alert>
  <section v-if="rows.length" class="panel padded print-report">
    <div class="print-report-heading">
      <img src="/logo-tecnm.png" alt="Tecnológico Nacional de México" width="150" height="68" />
      <div><h2>Servicio social · Alumnos pendientes de entrega</h2>
        <p>Reporte {{ reporte }} · Periodo {{ periodo || 'todos' }} · {{ rows.length }} {{ rows.length === 1 ? 'alumno' : 'alumnos' }}</p>
        <p class="muted">Generado el {{ generado }}</p></div>
    </div>
    <div class="print-report-table-wrapper"><table class="print-report-table">
      <thead><tr><th scope="col">Número de control</th><th scope="col">Nombre completo</th><th scope="col">Programa</th><th scope="col">Periodo</th></tr></thead>
      <tbody><tr v-for="item in rows" :key="item.numero_control"><td>{{ item.numero_control }}</td><td>{{ item.nombre_completo }}</td><td>{{ item.programa }}</td><td>{{ item.periodo }}</td></tr></tbody>
    </table></div>
  </section>
</template>
