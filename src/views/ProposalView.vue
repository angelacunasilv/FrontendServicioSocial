<script setup lang="ts">
import { ref } from 'vue';
import PageHeading from '../components/PageHeading.vue';
import FormFields from '../components/FormFields.vue';
import FileInput from '../components/FileInput.vue';
import StatusChip from '../components/StatusChip.vue';
import ProgramDetails from '../components/ProgramDetails.vue';
import PdfPreview from '../components/PdfPreview.vue';
import { useEnrollment } from '../composables/useEnrollment';
import { useForm } from '../composables/useForm';
import { camposExterno, fecha } from '../lib/catalogos';
import { comprobarPdf, externoSchema, pdfSchema } from '../lib/validation';
import { request } from '../lib/api';
import { useUiStore } from '../stores/ui';
import type { Programa, Respuesta } from '../types';
const enrollment = useEnrollment();
const form = useForm(externoSchema, Object.fromEntries(camposExterno.map(field => [field.key, ''])));
const file = ref<File | null>(null);
const fileError = ref('');
const editing = ref(false);
const preview = ref<string | null>(null);
function correct() {
  const source = enrollment.propuesta.value as unknown as Record<string, unknown>;
  form.reset(Object.fromEntries(camposExterno.map(field => [field.key, field.key === 'nombreEmpresa' ? source.nombreProyecto : source[field.key] ?? ''])));
  editing.value = true;
}
async function submit() {
  if (form.busy || !enrollment.canSelect.value) return;
  const data = form.validate();
  fileError.value = '';
  if (file.value) {
    const result = pdfSchema.safeParse(file.value);
    if (!result.success) fileError.value = result.error.issues[0].message;
  }
  if (!data || fileError.value) return;
  form.busy = true;
  try {
    let body: unknown = data;
    if (file.value) {
      try { await comprobarPdf(file.value); } catch (failure) { fileError.value = (failure as Error).message; return; }
      const multipart = new FormData();
      Object.entries(data).forEach(([key, value]) => multipart.set(key, value));
      multipart.set('archivo', file.value);
      body = multipart;
    }
    const response = await request<Respuesta<Programa>>('/alumnos/me/propuesta', { method: 'POST', body });
    editing.value = false;
    file.value = null;
    form.reset();
    useUiStore().notificar(response.mensaje ?? 'Su propuesta ha sido subida exitosamente.');
    await enrollment.load();
  } catch (failure) { form.serverError(failure); } finally { form.busy = false; }
}
</script>
<template>
  <PageHeading title="Propuesta propia" subtitle="Registra un programa externo y consulta el dictamen de la Oficina de Servicio Social.">
    <v-btn variant="outlined" prepend-icon="$refresh" :loading="enrollment.busy.value" @click="enrollment.load">Actualizar</v-btn>
  </PageHeading>
  <v-progress-linear v-if="enrollment.busy.value" color="primary" indeterminate aria-label="Cargando propuesta" />
  <v-alert v-if="enrollment.error.value" type="error" role="alert">{{ enrollment.error.value }}<v-btn variant="text" @click="enrollment.load">Reintentar</v-btn></v-alert>
  <template v-else-if="!enrollment.busy.value">
    <section v-if="enrollment.propuesta.value" class="panel padded mb-6">
      <div class="panel-heading"><div><span class="eyebrow">Última propuesta enviada</span><h2>{{ enrollment.propuesta.value.nombreProyecto }}</h2></div><StatusChip :value="enrollment.propuesta.value.estado" /></div>
      <p class="muted mb-5">Enviada el {{ fecha(enrollment.propuesta.value.fechaEnvio) }} · Folio #{{ enrollment.propuesta.value.id }}</p>
      <v-alert v-if="enrollment.propuesta.value.observaciones" :type="enrollment.propuesta.value.estado === 'RECHAZADO' ? 'warning' : 'info'" class="mb-5">
        <strong>Observaciones de la revisión</strong><p class="preserve-lines">{{ enrollment.propuesta.value.observaciones }}</p>
      </v-alert>
      <ProgramDetails :programa="enrollment.propuesta.value" />
      <div class="form-actions">
        <v-btn v-if="enrollment.propuesta.value.adjunto" variant="outlined" prepend-icon="$pdf" @click="preview = '/propuestas/' + enrollment.propuesta.value!.id + '/archivo'">Ver PDF adjunto</v-btn>
        <v-btn v-if="enrollment.propuesta.value.estado === 'RECHAZADO' && enrollment.canSelect.value && !editing" color="primary" @click="correct">Corregir y enviar nueva propuesta</v-btn>
      </div>
    </section>
    <v-alert v-if="enrollment.reason.value" type="info" class="mb-5">{{ enrollment.reason.value }} <router-link v-if="enrollment.expediente.value" to="/expediente">Ver expediente</router-link></v-alert>
    <div v-if="!enrollment.propuesta.value" class="muted mb-4">Aún no cuenta con una propuesta propia registrada</div>
    <section v-if="enrollment.canSelect.value && (!enrollment.propuesta.value || editing)" class="panel padded">
      <h2 class="mb-2">Registrar propuesta externa</h2><p class="form-intro">Completa los datos de la empresa o dependencia. Los campos marcados con * son obligatorios.</p>
      <form novalidate @submit.prevent="submit">
        <v-alert v-if="form.message" type="error" class="mb-5" role="alert">{{ form.message }}</v-alert>
        <FormFields v-model="form.values" :fields="camposExterno" :errors="form.errors" :disabled="form.busy" />
        <FileInput v-model="file" label="Documento de la propuesta (opcional)" :error="fileError" :disabled="form.busy" />
        <div class="form-actions"><v-btn v-if="editing" :disabled="form.busy" @click="editing = false">Cancelar</v-btn><v-btn color="primary" type="submit" :loading="form.busy" prepend-icon="$upload">Enviar propuesta</v-btn></div>
      </form>
    </section>
  </template>
  <PdfPreview v-model="preview" title="Documento de la propuesta" />
</template>
