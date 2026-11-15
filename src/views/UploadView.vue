<script setup lang="ts">
import SelectField from '../components/SelectField.vue';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import PageHeading from '../components/PageHeading.vue';
import EmptyState from '../components/EmptyState.vue';
import FileInput from '../components/FileInput.vue';
import { useStudentFile } from '../composables/useStudentFile';
import { useForm } from '../composables/useForm';
import { comprobarPdf, documentoSchema, tipos } from '../lib/validation';
import { tiposDocumento } from '../lib/catalogos';
import { request } from '../lib/api';
import { useUiStore } from '../stores/ui';
import type { Respuesta } from '../types';
const route = useRoute();
const initialType = tipos.includes(route.query.tipo as typeof tipos[number]) ? route.query.tipo : '';
const form = useForm(documentoSchema, { tipo: initialType, numeroReporte: route.query.numero ?? '', horas: '', archivo: null });
const file = ref<File | null>(null);
const { expediente, busy, error, missing, load } = useStudentFile();
const accepted = computed(() => expediente.value?.entregas.some(entrega =>
  entrega.tipo === form.values.tipo && (entrega.numeroReporte ?? 0) === (form.values.tipo === 'REPORTE_BIMESTRAL' ? Number(form.values.numeroReporte) : 0)
  && entrega.estado === 'ACEPTADO'));
watch(file, value => { form.values.archivo = value; form.errors.archivo = ''; });
watch(() => form.values.tipo, () => {
  form.values.numeroReporte = '';
  form.values.horas = '';
  form.errors = {};
});
async function submit() {
  if (form.busy || accepted.value || !expediente.value) return;
  const data = form.validate();
  if (!data) return;
  form.busy = true;
  try {
    try { await comprobarPdf(data.archivo); } catch (failure) { form.errors.archivo = (failure as Error).message; return; }
    const body = new FormData();
    body.set('tipo', data.tipo);
    body.set('archivo', data.archivo);
    if (data.tipo === 'REPORTE_BIMESTRAL') body.set('numeroReporte', String(data.numeroReporte));
    if ('horas' in data) body.set('horas', String(data.horas));
    const response = await request<Respuesta<unknown>>('/documentos', { method: 'POST', body });
    file.value = null;
    form.reset({ tipo: '', numeroReporte: '', horas: '', archivo: null });
    useUiStore().notificar(response.mensaje ?? 'Su documento ha sido subido exitosamente.');
    await load();
  } catch (failure) { form.serverError(failure); } finally { form.busy = false; }
}
</script>
<template>
  <PageHeading title="Subir documentos" subtitle="Entrega la documentación de tu servicio social en formato PDF.">
    <v-btn to="/expediente" variant="outlined" prepend-icon="$document">Ver mi expediente</v-btn>
  </PageHeading>
  <v-progress-linear v-if="busy" indeterminate color="primary" aria-label="Consultando expediente" />
  <v-alert v-if="error" type="error" role="alert">{{ error }}<v-btn variant="text" @click="load">Reintentar</v-btn></v-alert>
  <EmptyState v-else-if="missing" title="Primero selecciona un programa" text="Debes estar registrado en un programa para subir tus documentos." icon="$bank"><v-btn color="primary" to="/programas">Consultar programas</v-btn></EmptyState>
  <section v-else-if="expediente" class="panel padded form-panel">
    <div class="panel-heading"><div><h2>Nueva entrega</h2><p class="muted">{{ expediente.programa.nombreProyecto }}</p></div><v-icon icon="$pdf" size="28" color="primary" /></div>
    <p class="form-intro">Los campos marcados con * son obligatorios. Revisa el formato oficial antes de subirlo.</p>
    <form novalidate @submit.prevent="submit">
      <v-alert v-if="form.message" type="error" role="alert" class="mb-5">{{ form.message }}</v-alert>
      <SelectField v-model="form.values.tipo" :items="tiposDocumento" label="Tipo de documento *" name="tipo" :error-messages="form.errors.tipo" :disabled="form.busy" />
      <SelectField v-if="form.values.tipo === 'REPORTE_BIMESTRAL'" v-model="form.values.numeroReporte" label="Número de reporte *" name="numeroReporte"
        :items="[1, 2, 3].map(value => ({ title: 'Reporte ' + value, value }))" :error-messages="form.errors.numeroReporte" :disabled="form.busy" />
      <v-text-field v-if="['REPORTE_BIMESTRAL', 'REPORTE_FINAL'].includes(String(form.values.tipo))" v-model="form.values.horas"
        label="Horas realizadas durante el periodo *" name="horas" type="number" min="0" max="10000" step="1" :error-messages="form.errors.horas"
        :disabled="form.busy" hint="Indica las horas de este periodo para evitar duplicar las de entregas anteriores." persistent-hint />
      <FileInput v-model="file" :error="form.errors.archivo" :disabled="form.busy" />
      <v-alert v-if="accepted" type="success" class="mt-4">Esta entrega ya fue aceptada. Puedes consultar su PDF en tu expediente.</v-alert>
      <div class="form-actions"><v-btn to="/formatos" variant="text">Descargar formatos</v-btn><v-btn type="submit" color="primary" prepend-icon="$upload" :loading="form.busy" :disabled="accepted">Subir documento</v-btn></div>
    </form>
  </section>
</template>
