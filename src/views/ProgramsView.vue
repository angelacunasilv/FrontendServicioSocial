<script setup lang="ts">
import { computed, ref } from 'vue';
import PageHeading from '../components/PageHeading.vue';
import EmptyState from '../components/EmptyState.vue';
import FormFields from '../components/FormFields.vue';
import PaginationBar from '../components/PaginationBar.vue';
import ProgramDetails from '../components/ProgramDetails.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import StatusChip from '../components/StatusChip.vue';
import { useList } from '../composables/useList';
import { useForm } from '../composables/useForm';
import { useEnrollment } from '../composables/useEnrollment';
import { camposInterno } from '../lib/catalogos';
import { internoSchema } from '../lib/validation';
import { request } from '../lib/api';
import { useAuthStore } from '../stores/auth';
import { useUiStore } from '../stores/ui';
import type { Programa, Respuesta } from '../types';
const auth = useAuthStore();
const ui = useUiStore();
const periodo = ref('');
const list = useList<Programa>('/programas', () => ({ periodo: periodo.value }));
const enrollment = useEnrollment();
const staff = computed(() => auth.usuario?.rol === 'JSS');
const modal = ref(false);
const editing = ref<Programa | null>(null);
const details = ref<Programa | null>(null);
const selected = ref<Programa | null>(null);
const archive = ref<Programa | null>(null);
const actionBusy = ref(false);
const actionError = ref('');
const form = useForm(internoSchema, {});
function openForm(item: Programa | null = null) {
  editing.value = item;
  const source = (item ?? {}) as unknown as Record<string, unknown>;
  form.reset(Object.fromEntries(camposInterno.map(field => [field.key, source[field.key] ?? ''])));
  modal.value = true;
}
async function save() {
  if (form.busy) return;
  const data = form.validate();
  if (!data) return;
  form.busy = true;
  try {
    const response = await request<Respuesta<Programa>>(editing.value ? '/programas/' + editing.value.id : '/programas', {
      method: editing.value ? 'PUT' : 'POST', body: data,
    });
    modal.value = false;
    ui.notificar(response.mensaje ?? 'Programa guardado');
    await list.load();
  } catch (failure) { form.serverError(failure); } finally { form.busy = false; }
}
function choose(item: Programa) { selected.value = item; actionError.value = ''; }
async function enroll() {
  if (!selected.value || actionBusy.value) return;
  actionBusy.value = true;
  actionError.value = '';
  try {
    const response = await request<Respuesta<unknown>>('/alumnos/me/seleccion', { method: 'POST', body: { folio: selected.value.id } });
    selected.value = null;
    ui.notificar(response.mensaje ?? 'Programa de servicio social seleccionado con éxito');
    await Promise.all([list.load(), enrollment.load()]);
  } catch (failure) { actionError.value = (failure as Error).message; await list.load(); }
  finally { actionBusy.value = false; }
}
async function archiveProgram() {
  if (!archive.value || actionBusy.value) return;
  actionBusy.value = true;
  try {
    await request('/programas/' + archive.value.id, { method: 'DELETE' });
    archive.value = null;
    ui.notificar('Programa archivado');
    await list.load();
  } catch (failure) { actionError.value = (failure as Error).message; } finally { actionBusy.value = false; }
}
</script>
<template>
  <PageHeading :title="staff ? 'Gestión del banco de programas' : 'Banco de programas'"
    :subtitle="staff ? 'Registra y administra la oferta institucional de servicio social.' : 'Consulta las actividades y elige un programa con cupo disponible.'">
    <v-btn v-if="staff" color="primary" prepend-icon="$plus" @click="openForm()">Nuevo programa</v-btn>
  </PageHeading>
  <v-alert v-if="!staff && enrollment.error.value" type="error" class="mb-5" role="alert">{{ enrollment.error.value }} <v-btn variant="text" @click="enrollment.load">Reintentar</v-btn></v-alert>
  <v-alert v-else-if="!staff && !enrollment.busy.value && enrollment.reason.value" type="info" class="mb-5">
    {{ enrollment.reason.value }} <router-link v-if="enrollment.expediente.value" to="/expediente">Ver mi expediente</router-link>
  </v-alert>
  <section class="panel">
    <form class="table-toolbar" @submit.prevent="list.page.value = 1; list.load()">
      <div><h2>Programas institucionales</h2><p>El folio identifica cada programa.</p></div>
      <v-text-field v-model="periodo" label="Filtrar por periodo" placeholder="Ej. 2026-2" maxlength="32" clearable hide-details
        class="toolbar-field" @click:clear="periodo = ''" />
      <v-btn icon="$refresh" variant="text" aria-label="Actualizar programas" :loading="list.busy.value" @click="list.load" />
    </form>
    <v-progress-linear v-if="list.busy.value" indeterminate color="primary" aria-label="Cargando programas" />
    <v-alert v-if="list.error.value" type="error" class="ma-5" role="alert">{{ list.error.value }}<v-btn variant="text" @click="list.load">Reintentar</v-btn></v-alert>
    <v-table v-else-if="list.rows.value.length" class="data-table"><thead><tr><th>Folio</th><th>Programa / área</th><th>Periodo</th><th>Cupo disponible</th><th v-if="staff">Estatus</th><th class="align-right">Acciones</th></tr></thead>
      <tbody><tr v-for="item in list.rows.value" :key="item.id"><td class="mono">#{{ item.id }}</td>
        <td><strong>{{ item.nombreProyecto }}</strong><small>{{ item.area }}</small></td><td>{{ item.periodo }}</td>
        <td><span :class="{ 'text-error': item.cupoDisponible === 0 }">{{ item.cupoDisponible }} / {{ item.cupo }}</span></td>
        <td v-if="staff"><StatusChip :value="item.activo ? 'ACTIVO' : 'INACTIVO'" /></td>
        <td class="align-right"><div class="row-actions">
          <v-btn size="small" variant="text" @click="details = item">Ver detalles</v-btn>
          <template v-if="staff"><v-btn size="small" variant="text" icon="$edit" :aria-label="'Editar ' + item.nombreProyecto" @click="openForm(item)" />
            <v-btn v-if="item.activo" size="small" variant="text" icon="$archive" :aria-label="'Archivar ' + item.nombreProyecto" @click="archive = item; actionError = ''" /></template>
          <v-btn v-else color="primary" size="small" :disabled="!enrollment.canSelect.value || !item.cupoDisponible" @click="choose(item)">
            {{ item.cupoDisponible === 0 ? 'Cupo lleno' : 'Seleccionar' }}</v-btn>
        </div></td></tr></tbody>
    </v-table>
    <EmptyState v-else-if="!list.busy.value" title="No hay programas para mostrar" text="Prueba otro periodo o vuelve a consultar más tarde." icon="$bank" />
    <PaginationBar v-model="list.page.value" :total="list.total.value" :limit="list.limit" :busy="list.busy.value" />
  </section>

  <v-dialog v-model="modal" max-width="830" :persistent="form.busy" aria-labelledby="program-form-title"><v-card>
    <v-card-title id="program-form-title">{{ editing ? 'Editar programa' : 'Nuevo programa institucional' }}</v-card-title>
    <form novalidate @submit.prevent="save"><v-card-text><p class="form-intro">Los campos marcados con * son obligatorios.</p>
      <v-alert v-if="form.message" type="error" class="mb-5" role="alert">{{ form.message }}</v-alert>
      <v-alert v-if="editing" type="info" class="mb-5">El cupo total debe incluir a los alumnos que ya están inscritos. Actualmente hay {{ editing.cupo! - editing.cupoDisponible! }} inscripciones.</v-alert>
      <FormFields v-model="form.values" :fields="camposInterno" :errors="form.errors" :disabled="form.busy" />
    </v-card-text><v-card-actions><v-spacer /><v-btn :disabled="form.busy" @click="modal = false">Cancelar</v-btn><v-btn type="submit" color="primary" variant="flat" :loading="form.busy">Guardar programa</v-btn></v-card-actions></form>
  </v-card></v-dialog>
  <v-dialog aria-label="Detalles del programa" :model-value="Boolean(details)" max-width="760" @update:model-value="value => { if (!value) details = null; }"><v-card v-if="details">
    <v-card-title class="dialog-heading"><span>{{ details.nombreProyecto }}</span><v-btn icon="$close" variant="text" aria-label="Cerrar detalles" @click="details = null" /></v-card-title>
    <v-card-text><ProgramDetails :programa="details" /><v-alert v-if="details.cupoDisponible === 0" type="warning" class="mt-5">El cupo de este programa ya está lleno</v-alert></v-card-text>
  </v-card></v-dialog>
  <ConfirmDialog :model-value="Boolean(selected)" @update:model-value="value => { if (!value) selected = null; }"
    title="Confirmar selección de programa" :text="'Te inscribirás en ' + (selected?.nombreProyecto ?? '') + '. Revisa las actividades y el horario antes de continuar.'"
    :busy="actionBusy" :error="actionError" action="Confirmar inscripción" @confirm="enroll" />
  <ConfirmDialog :model-value="Boolean(archive)" @update:model-value="value => { if (!value) archive = null; }"
    title="Archivar programa" :text="'Se cerrarán las nuevas inscripciones a ' + (archive?.nombreProyecto ?? '') + '. Se conserva el historial de sus alumnos.'"
    :busy="actionBusy" :error="actionError" action="Archivar programa" @confirm="archiveProgram" />
</template>
