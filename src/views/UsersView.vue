<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import PageHeading from '../components/PageHeading.vue';
import FormFields from '../components/FormFields.vue';
import PaginationBar from '../components/PaginationBar.vue';
import StatusChip from '../components/StatusChip.vue';
import EmptyState from '../components/EmptyState.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import { useList } from '../composables/useList';
import { useForm } from '../composables/useForm';
import { identificador, usuarioSchema } from '../lib/validation';
import { request } from '../lib/api';
import { roles, rolNombre } from '../lib/catalogos';
import { useAuthStore } from '../stores/auth';
import { useUiStore } from '../stores/ui';
import type { Campo, Respuesta, Usuario } from '../types';
const auth = useAuthStore();
const ui = useUiStore();
const router = useRouter();
const filter = ref('');
const applied = ref('');
const filterError = ref('');
const list = useList<Usuario>('/usuarios', () => ({ identificador: applied.value }));
const modal = ref(false);
const editing = ref<Usuario | null>(null);
const active = ref(true);
const detailsBusy = ref(false);
const initialPassword = ref('');
const createdId = ref('');
const generatedModal = ref(false);
const deleting = ref<Usuario | null>(null);
const deleteBusy = ref(false);
const deleteError = ref('');
const form = useForm(usuarioSchema, {});
const fields = computed<Campo[]>(() => [
  { key: 'identificador', label: 'Número de control o ID de usuario', maxlength: 32 },
  { key: 'rol', label: 'Rol institucional', kind: 'select', items: roles },
  { key: 'nombreCompleto', label: 'Nombre completo', maxlength: 221, full: true, autocomplete: 'name' },
  { key: 'correo', label: 'Correo institucional', kind: 'email', maxlength: 254, full: true, autocomplete: 'email' },
  ...(form.values.rol === 'ALU' ? [
    { key: 'carrera', label: 'Carrera', maxlength: 120, optional: true },
    { key: 'semestre', label: 'Semestre', kind: 'number' as const, min: 1, max: 20, optional: true },
    { key: 'planEstudios', label: 'Plan de estudios', maxlength: 120, optional: true, full: true },
  ] : [{ key: 'departamento', label: 'Departamento', maxlength: 120, optional: true, full: true }]),
  { key: 'contrasena', label: editing.value ? 'Nueva contraseña' : 'Contraseña de acceso', kind: 'password', maxlength: 128, optional: true,
    full: true, hint: editing.value ? 'Completa este campo para cambiar la clave. Mínimo 12 caracteres.' : 'Si se omite, se genera una clave que se mostrará una sola vez.' },
]);
function search() {
  filterError.value = '';
  if (!(filter.value ?? '').trim()) { applied.value = ''; list.page.value = 1; void list.load(); return; }
  const result = identificador.safeParse(filter.value);
  if (!result.success) { filterError.value = result.error.issues[0].message; return; }
  applied.value = result.data;
  list.page.value = 1;
}
async function open(item: Usuario | null = null) {
  if (detailsBusy.value) return;
  detailsBusy.value = true;
  try {
    let source: Record<string, unknown> = { rol: 'ALU' };
    if (item) {
      const response = await request<Respuesta<Usuario>>('/usuarios/' + item.id);
      source = { ...response.datos, ...response.datos.perfil };
      active.value = response.datos.activo;
    } else active.value = true;
    editing.value = item;
    form.reset({
      identificador: source.identificador ?? '', nombreCompleto: source.nombreCompleto ?? '',
      correo: source.correo ?? '', rol: source.rol ?? 'ALU', contrasena: '',
      carrera: source.carrera ?? '', semestre: source.semestre ?? '', planEstudios: source.planEstudios ?? '', departamento: source.departamento ?? '',
    });
    modal.value = true;
  } catch (failure) { ui.notificar((failure as Error).message, 'error'); } finally { detailsBusy.value = false; }
}
async function save() {
  if (form.busy) return;
  const data = form.validate();
  if (!data) return;
  form.busy = true;
  try {
    const response = await request<Respuesta<Usuario> & { contrasenaInicial?: string }>(editing.value ? '/usuarios/' + editing.value.id : '/usuarios', {
      method: editing.value ? 'PUT' : 'POST', body: editing.value ? { ...data, activo: active.value } : data,
    });
    const selfEdit = editing.value?.id === auth.usuario?.id;
    modal.value = false;
    form.reset();
    ui.notificar(response.mensaje ?? 'Usuario guardado');
    if (selfEdit) {
      auth.limpiar();
      ui.notificar('Tu cuenta fue actualizada. Inicia sesión nuevamente.', 'info');
      await router.replace('/iniciar-sesion');
      return;
    }
    if (response.contrasenaInicial) {
      initialPassword.value = response.contrasenaInicial;
      createdId.value = response.datos.identificador;
      generatedModal.value = true;
    }
    await list.load();
  } catch (failure) { form.serverError(failure); } finally { form.busy = false; }
}
async function remove() {
  if (!deleting.value || deleteBusy.value) return;
  deleteBusy.value = true;
  deleteError.value = '';
  try {
    const ownId = deleting.value.id === auth.usuario?.id;
    await request('/usuarios/' + deleting.value.id, { method: 'DELETE', body: { confirmar: true } });
    deleting.value = null;
    ui.notificar('Usuario dado de baja con éxito');
    if (ownId) { auth.limpiar(); await router.replace('/iniciar-sesion'); }
    else await list.load();
  } catch (failure) { deleteError.value = (failure as Error).message; } finally { deleteBusy.value = false; }
}
</script>
<template>
  <PageHeading title="Gestión de usuarios" subtitle="Crea accesos, asigna roles y administra el estado de las cuentas.">
    <v-btn color="primary" prepend-icon="$plus" :loading="detailsBusy" @click="open()">Nuevo usuario</v-btn>
  </PageHeading>
  <section class="panel">
    <form class="table-toolbar" novalidate @submit.prevent="search"><div><h2>Usuarios del sistema</h2><p>Alumnos y personal institucional</p></div>
      <v-text-field v-model="filter" label="Número de control o ID" maxlength="32" :error-messages="filterError" hide-details="auto" class="toolbar-field" clearable @click:clear="filter = ''; search()" />
      <v-btn variant="outlined" prepend-icon="$search" type="submit" :disabled="list.busy.value">Buscar</v-btn></form>
    <v-progress-linear v-if="list.busy.value" indeterminate color="primary" aria-label="Cargando usuarios" />
    <v-alert v-if="list.error.value" type="error" class="ma-5" role="alert">{{ list.error.value }}<v-btn variant="text" @click="list.load">Reintentar</v-btn></v-alert>
    <v-table v-else-if="list.rows.value.length" class="data-table"><thead><tr><th>Número de control / ID</th><th>Nombre y correo</th><th>Rol</th><th>Estatus</th><th class="align-right">Acciones</th></tr></thead>
      <tbody><tr v-for="item in list.rows.value" :key="item.id"><td class="mono">{{ item.identificador }}</td><td><strong>{{ item.nombreCompleto }}</strong><small>{{ item.correo }}</small></td>
        <td>{{ rolNombre(item.rol) }}</td><td><StatusChip :value="item.activo ? 'ACTIVO' : 'INACTIVO'" /></td><td class="align-right"><div class="row-actions">
          <v-btn size="small" variant="text" prepend-icon="$edit" :disabled="detailsBusy" @click="open(item)">Editar</v-btn>
          <v-btn v-if="item.activo" size="small" variant="text" color="error" @click="deleting = item; deleteError = ''">Dar de baja</v-btn>
        </div></td></tr></tbody>
    </v-table>
    <EmptyState v-else-if="!list.busy.value" title="No se encontró el usuario" text="Comprueba el identificador o consulta todos los usuarios." icon="$users" />
    <PaginationBar v-model="list.page.value" :total="list.total.value" :limit="list.limit" :busy="list.busy.value" />
  </section>
  <v-dialog aria-label="Formulario de usuario" v-model="modal" max-width="760" :persistent="form.busy"><v-card>
    <v-card-title>{{ editing ? 'Editar acceso de usuario' : 'Crear acceso de usuario' }}</v-card-title>
    <form novalidate @submit.prevent="save"><v-card-text><p class="form-intro">Los campos marcados con * son obligatorios.</p>
      <v-alert v-if="form.message" type="error" role="alert" class="mb-5">{{ form.message }}</v-alert>
      <v-alert v-if="editing?.id === auth.usuario?.id" type="warning" class="mb-5">Al guardar cambios en tu propia cuenta, tendrás que iniciar sesión de nuevo.</v-alert>
      <FormFields v-model="form.values" :fields="fields" :errors="form.errors" :disabled="form.busy" />
      <v-switch v-if="editing" v-model="active" label="Cuenta activa" color="primary" hide-details :disabled="form.busy" />
    </v-card-text><v-card-actions><v-spacer /><v-btn :disabled="form.busy" @click="modal = false; form.reset()">Cancelar</v-btn>
      <v-btn type="submit" color="primary" variant="flat" :loading="form.busy">{{ editing ? 'Guardar cambios' : 'Crear acceso' }}</v-btn></v-card-actions></form>
  </v-card></v-dialog>
  <ConfirmDialog :model-value="Boolean(deleting)" @update:model-value="value => { if (!value) deleting = null; }"
    title="Dar de baja al usuario" :text="'Se suspenderá el acceso de ' + (deleting?.nombreCompleto ?? '') + '. El sistema conservará su expediente y sus registros históricos.'"
    action="Confirmar baja" danger :busy="deleteBusy" :error="deleteError" @confirm="remove" />
  <v-dialog aria-label="Acceso creado con éxito" v-model="generatedModal" max-width="520" @after-leave="initialPassword = ''"><v-card title="Acceso creado con éxito">
    <v-card-text><p>Entrega esta clave al usuario <strong>{{ createdId }}</strong> por un canal privado. Se muestra una sola vez.</p>
      <div class="generated-password" tabindex="0" aria-label="Contraseña inicial generada">{{ initialPassword }}</div>
      <p class="muted">El alumno puede cambiarla desde Datos personales.</p>
    </v-card-text><v-card-actions><v-spacer /><v-btn color="primary" @click="generatedModal = false; initialPassword = ''">Listo</v-btn></v-card-actions>
  </v-card></v-dialog>
</template>
