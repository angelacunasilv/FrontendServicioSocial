<script setup lang="ts">
import { ref, watch } from 'vue';
import PageHeading from '../components/PageHeading.vue';
import FormFields from '../components/FormFields.vue';
import PaginationBar from '../components/PaginationBar.vue';
import EmptyState from '../components/EmptyState.vue';
import { useForm } from '../composables/useForm';
import { faltantesSchema } from '../lib/validation';
import { descargar, query, request } from '../lib/api';
import { useUiStore } from '../stores/ui';
import type { Campo, Pagina } from '../types';
interface Faltante { numeroControl: string; nombreCompleto: string; programa: string; periodo: string }
const form = useForm(faltantesSchema, { reporte: '', periodo: '' });
const fields: Campo[] = [
  { key: 'reporte', label: 'Reporte a consultar', kind: 'select', items: [
    { title: 'Reporte bimestral 1', value: '1' }, { title: 'Reporte bimestral 2', value: '2' },
    { title: 'Reporte bimestral 3', value: '3' }, { title: 'Informe final', value: 'final' },
  ] },
  { key: 'periodo', label: 'Periodo del programa', optional: true, maxlength: 32, hint: 'Déjalo vacío para consultar todos los periodos.' },
];
const applied = ref<{ reporte: string; periodo?: unknown } | null>(null);
const rows = ref<Faltante[]>([]);
const total = ref(0);
const page = ref(1);
const queried = ref(false);
const exportBusy = ref(false);
const error = ref('');
let sequence = 0;
async function load() {
  if (!applied.value) return;
  const current = ++sequence;
  form.busy = true;
  error.value = '';
  try {
    const response = await request<Pagina<Faltante>>('/reportes/faltantes' + query({ ...applied.value, pagina: page.value, limite: 10 }));
    if (current !== sequence) return;
    rows.value = response.datos;
    total.value = response.paginacion.total;
    queried.value = true;
  } catch (failure) { if (current === sequence) error.value = (failure as Error).message; }
  finally { if (current === sequence) form.busy = false; }
}
async function submit() {
  if (form.busy) return;
  const data = form.validate();
  if (!data) return;
  applied.value = data;
  if (page.value !== 1) page.value = 1;
  else await load();
}
watch(page, load);
function csvPath() { return '/reportes/faltantes' + query({ ...applied.value, formato: 'csv' }); }
async function exportCsv() {
  if (exportBusy.value) return;
  exportBusy.value = true;
  try { await descargar(csvPath(), 'alumnos-faltantes-' + applied.value!.reporte + '.csv'); }
  catch (failure) { useUiStore().notificar((failure as Error).message, 'error'); } finally { exportBusy.value = false; }
}
</script>
<template>
  <PageHeading title="Reporte de alumnos faltantes" subtitle="Consulta quiénes aún no entregan el reporte seleccionado y exporta el listado." />
  <section class="panel padded mb-6">
    <form novalidate @submit.prevent="submit"><v-alert v-if="form.message" type="error" role="alert" class="mb-5">{{ form.message }}</v-alert>
      <FormFields v-model="form.values" :fields="fields" :errors="form.errors" :disabled="form.busy" />
      <div class="form-actions"><v-btn type="submit" color="primary" prepend-icon="$search" :loading="form.busy">Generar reporte</v-btn></div>
    </form>
  </section>
  <v-alert v-if="error" type="error" role="alert" class="mb-5">{{ error }}<v-btn variant="text" @click="load">Reintentar</v-btn></v-alert>
  <section v-if="queried && !error" class="panel">
    <div class="table-toolbar"><div><h2>Resultado de la consulta</h2><p>Reporte {{ applied?.reporte }} · Periodo {{ applied?.periodo || 'todos' }}</p></div>
      <div v-if="total" class="row-actions"><v-btn variant="outlined" prepend-icon="$print" :disabled="form.busy"
        :to="{ path: '/reportes/imprimir', query: { reporte: applied?.reporte, periodo: String(applied?.periodo ?? '') } }">Vista para imprimir</v-btn>
        <v-btn color="primary" prepend-icon="$download" :loading="exportBusy" :disabled="form.busy" @click="exportCsv">Exportar CSV</v-btn></div></div>
    <v-progress-linear v-if="form.busy" indeterminate color="primary" aria-label="Generando reporte" />
    <v-table v-if="rows.length" class="data-table"><thead><tr><th>Número de control</th><th>Alumno</th><th>Programa</th><th>Periodo</th></tr></thead>
      <tbody><tr v-for="item in rows" :key="item.numeroControl"><td class="mono">{{ item.numeroControl }}</td><td>{{ item.nombreCompleto }}</td><td>{{ item.programa }}</td><td>{{ item.periodo }}</td></tr></tbody></v-table>
    <EmptyState v-else-if="!form.busy" title="No se encontraron alumnos pendientes de entrega para este periodo" text="Puedes consultar otro número de reporte o periodo." icon="$check" />
    <PaginationBar v-model="page" :total="total" :limit="10" :busy="form.busy" />
  </section>
  <p class="muted mt-5">Este listado identifica reportes sin entrega. Las correcciones y los rechazos se consultan en la revisión de documentos. La exportación y la vista de impresión incluyen hasta 10 000 alumnos.</p>
</template>
