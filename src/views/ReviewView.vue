<script setup lang="ts">
import SelectField from '../components/SelectField.vue';
import { computed, ref } from 'vue';
import PageHeading from '../components/PageHeading.vue';
import PaginationBar from '../components/PaginationBar.vue';
import EmptyState from '../components/EmptyState.vue';
import StatusChip from '../components/StatusChip.vue';
import ProgramDetails from '../components/ProgramDetails.vue';
import PdfPreview from '../components/PdfPreview.vue';
import { useList } from '../composables/useList';
import { useForm } from '../composables/useForm';
import { revisionSchema } from '../lib/validation';
import { estados, fecha, nombreDocumento } from '../lib/catalogos';
import { request } from '../lib/api';
import { useUiStore } from '../stores/ui';
import type { Documento, Programa, Respuesta } from '../types';
const props = defineProps<{ kind: 'propuestas' | 'documentos' }>();
const proposalMode = props.kind === 'propuestas';
const estado = ref('PENDIENTE');
const list = useList<Programa | Documento>('/' + props.kind, () => ({ estado: estado.value }));
const selected = ref<Programa | Documento | null>(null);
const program = computed(() => selected.value && 'nombreProyecto' in selected.value ? selected.value : null);
const document = computed(() => selected.value && 'tipo' in selected.value && !('nombreProyecto' in selected.value) ? selected.value as Documento : null);
const preview = ref<string | null>(null);
const form = useForm(revisionSchema, { estado: '', observaciones: '' });
function student(item: Programa | Documento) {
  return 'nombreProyecto' in item ? item.autor : item.expediente?.alumno.usuario;
}
function title(item: Programa | Documento) {
  return 'nombreProyecto' in item ? item.nombreProyecto : nombreDocumento(item.tipo, item.numeroReporte);
}
function open(item: Programa | Documento) {
  selected.value = item;
  form.reset({ estado: '', observaciones: '' });
}
async function save() {
  if (form.busy || !selected.value) return;
  const data = form.validate();
  if (!data) return;
  form.busy = true;
  try {
    const response = await request<Respuesta<unknown>>('/' + props.kind + '/' + selected.value.id + '/revision', { method: 'PUT', body: data });
    selected.value = null;
    useUiStore().notificar(response.mensaje ?? 'El estado se ha asignado exitosamente.');
    await list.load();
  } catch (failure) { form.serverError(failure); await list.load(); } finally { form.busy = false; }
}
</script>
<template>
  <PageHeading :title="proposalMode ? 'Revisar propuestas externas' : 'Revisar documentos y reportes'"
    :subtitle="proposalMode ? 'Consulta las propuestas propias de los alumnos y registra tu dictamen.' : 'Valida las entregas y comunica las correcciones necesarias.'">
    <v-btn variant="outlined" prepend-icon="$refresh" :loading="list.busy.value" @click="list.load">Actualizar</v-btn>
  </PageHeading>
  <section class="panel">
    <div class="table-toolbar"><div><h2>{{ proposalMode ? 'Propuestas de alumnos' : 'Documentos entregados' }}</h2><p>{{ list.total.value }} {{ list.total.value === 1 ? 'registro' : 'registros' }} en la selección actual</p></div>
      <SelectField v-model="estado" :items="estados" label="Estado de revisión" :allow-empty="false" hide-details class="toolbar-field" /></div>
    <v-progress-linear v-if="list.busy.value" indeterminate color="primary" aria-label="Cargando entregas" />
    <v-alert v-if="list.error.value" type="error" class="ma-5" role="alert">{{ list.error.value }}<v-btn variant="text" @click="list.load">Reintentar</v-btn></v-alert>
    <v-table v-else-if="list.rows.value.length" class="data-table"><thead><tr><th>Alumno</th><th>{{ proposalMode ? 'Propuesta' : 'Documento' }}</th><th>Estado</th><th class="align-right">Acciones</th></tr></thead>
      <tbody><tr v-for="item in list.rows.value" :key="item.id"><td><strong>{{ student(item)?.nombreCompleto ?? 'Alumno' }}</strong><small>{{ student(item)?.identificador }}</small></td>
        <td>{{ title(item) }}<small>Folio #{{ item.id }}</small></td><td><StatusChip :value="item.estado" /></td>
        <td class="align-right"><v-btn color="primary" size="small" :variant="item.estado === 'PENDIENTE' ? 'flat' : 'outlined'" @click="open(item)">{{ item.estado === 'PENDIENTE' ? 'Revisar' : 'Ver detalle' }}</v-btn></td></tr></tbody>
    </v-table>
    <EmptyState v-else-if="!list.busy.value" :title="proposalMode ? 'No hay propuestas en este estado' : 'No hay documentos en este estado'" text="Las nuevas entregas aparecerán aquí para su revisión." icon="$review" />
    <PaginationBar v-model="list.page.value" :total="list.total.value" :limit="list.limit" :busy="list.busy.value" />
  </section>
  <v-dialog aria-label="Revisión de entrega" :model-value="Boolean(selected)" max-width="830" :persistent="form.busy" @update:model-value="value => { if (!value) selected = null; }">
    <v-card v-if="selected"><v-card-title class="dialog-heading"><span>{{ title(selected) }}</span><v-btn icon="$close" variant="text" aria-label="Cerrar revisión" :disabled="form.busy" @click="selected = null" /></v-card-title>
      <form novalidate @submit.prevent="save"><v-card-text>
        <div class="panel-heading"><div><strong>{{ student(selected)?.nombreCompleto }}</strong><p class="muted">{{ student(selected)?.identificador }}</p></div><StatusChip :value="selected.estado" /></div>
        <ProgramDetails v-if="program" :programa="program" />
        <dl v-if="document" class="details-grid"><div><dt>Archivo</dt><dd>{{ document.nombreArchivo }}</dd></div>
          <div><dt>Fecha de entrega</dt><dd>{{ fecha(document.fechaSubida) }}</dd></div>
          <div v-if="document.horas !== null"><dt>Horas del periodo</dt><dd>{{ document.horas }}</dd></div></dl>
        <v-btn v-if="document || program?.adjunto" variant="outlined" prepend-icon="$pdf" class="mt-5"
          @click="preview = '/' + kind + '/' + selected!.id + '/archivo'">Abrir PDF para revisar</v-btn>
        <div v-if="selected.estado === 'PENDIENTE'" class="review-form">
          <h3>Dictamen</h3><p class="form-intro">Si rechazas la entrega, escribe las observaciones que debe atender el alumno.</p>
          <v-alert v-if="form.message" type="error" role="alert" class="mb-5">{{ form.message }}</v-alert>
          <SelectField v-model="form.values.estado" name="estado" :items="estados.filter(item => item.value !== 'PENDIENTE')" label="Estado a asignar *" :error-messages="form.errors.estado" :disabled="form.busy" />
          <v-textarea v-model="form.values.observaciones" name="observaciones" :label="form.values.estado === 'RECHAZADO' ? 'Observaciones o motivo de rechazo *' : 'Observaciones (opcional)'"
            maxlength="2000" counter :error-messages="form.errors.observaciones" :disabled="form.busy" />
        </div>
        <v-alert v-else-if="selected.observaciones" type="info" class="mt-5"><strong>Observaciones</strong><p class="preserve-lines">{{ selected.observaciones }}</p></v-alert>
      </v-card-text><v-card-actions><v-spacer /><v-btn :disabled="form.busy" @click="selected = null">{{ selected.estado === 'PENDIENTE' ? 'Cancelar' : 'Cerrar' }}</v-btn>
        <v-btn v-if="selected.estado === 'PENDIENTE'" type="submit" color="primary" variant="flat" :loading="form.busy">Guardar dictamen</v-btn></v-card-actions></form>
    </v-card>
  </v-dialog>
  <PdfPreview v-model="preview" />
</template>
