<script setup lang="ts">
import { onMounted, ref } from 'vue';
import PageHeading from '../components/PageHeading.vue';
import FormFields from '../components/FormFields.vue';
import { useAuthStore } from '../stores/auth';
import { useUiStore } from '../stores/ui';
import { useForm } from '../composables/useForm';
import { perfilSchema, obligatorio } from '../lib/validation';
import { request } from '../lib/api';
import type { Alumno, Campo, Respuesta, Usuario } from '../types';
const auth = useAuthStore();
const form = useForm(perfilSchema, {});
const loading = ref(true);
const error = ref('');
let original: Record<string, string> = {};
const fields: Campo[] = [
  { key: 'nombre', label: 'Nombre', maxlength: 100, autocomplete: 'given-name' },
  { key: 'apellidos', label: 'Apellidos', maxlength: 120, autocomplete: 'family-name' },
  { key: 'telefono', label: 'Número de teléfono', maxlength: 24, autocomplete: 'tel', optional: true, full: true },
  { key: 'contrasenaActual', label: 'Contraseña actual', kind: 'password', autocomplete: 'current-password', full: true },
  { key: 'nuevaContrasena', label: 'Nueva contraseña', kind: 'password', optional: true, hint: 'Al menos 12 caracteres.', maxlength: 128 },
  { key: 'confirmarContrasena', label: 'Confirmar nueva contraseña', kind: 'password', optional: true, maxlength: 128 },
];
async function load() {
  loading.value = true;
  error.value = '';
  try {
    await auth.cargarPerfil();
    const perfil = auth.perfil!;
    original = { nombre: perfil.nombre, apellidos: perfil.apellidos, telefono: perfil.telefono ?? '' };
    form.reset({ ...original, contrasenaActual: '', nuevaContrasena: '', confirmarContrasena: '' });
  } catch (failure) { error.value = (failure as Error).message; } finally { loading.value = false; }
}
onMounted(load);
async function submit() {
  if (form.busy) return;
  const data = form.validate();
  if (!data) return;
  const changes: Record<string, unknown> = { contrasenaActual: data.contrasenaActual };
  for (const key of ['nombre', 'apellidos', 'telefono'] as const) {
    const value = String(data[key] ?? '');
    if (value !== original[key]) {
      if (!value) { form.errors[key] = obligatorio; form.message = 'Revise los campos indicados'; return; }
      changes[key] = value;
    }
  }
  if (data.nuevaContrasena) changes.nuevaContrasena = data.nuevaContrasena;
  if (Object.keys(changes).length === 1) { form.message = 'Indique al menos un dato que desee actualizar'; return; }
  form.busy = true;
  try {
    const response = await request<Respuesta<Usuario & { perfil: Alumno }>>('/alumnos/me/perfil', { method: 'PUT', body: changes });
    auth.usuario = response.datos;
    auth.perfil = response.datos.perfil;
    useUiStore().notificar(response.mensaje ?? 'Datos actualizados exitosamente');
    await load();
  } catch (failure) { form.serverError(failure); } finally { form.busy = false; }
}
</script>
<template>
  <PageHeading title="Datos personales" subtitle="Actualiza tu nombre, teléfono y contraseña de acceso." />
  <v-progress-linear v-if="loading" indeterminate color="primary" aria-label="Cargando datos personales" />
  <v-alert v-if="error" type="error" role="alert">{{ error }}<v-btn variant="text" @click="load">Reintentar</v-btn></v-alert>
  <section v-else-if="!loading" class="panel padded form-panel">
    <div class="panel-heading"><h2>Mi información</h2><v-icon icon="$user" color="primary" /></div>
    <dl class="details-grid mb-6"><div><dt>Número de control</dt><dd>{{ auth.usuario?.identificador }}</dd></div><div><dt>Correo institucional</dt><dd>{{ auth.usuario?.correo }}</dd></div></dl>
    <form novalidate @submit.prevent="submit">
      <v-alert v-if="form.message" type="error" class="mb-5" role="alert">{{ form.message }}</v-alert>
      <p class="form-intro">Escribe tu contraseña actual para confirmar los cambios. Al cambiar tu contraseña, se renueva esta sesión y se cierran las anteriores.</p>
      <FormFields v-model="form.values" :fields="fields" :errors="form.errors" :disabled="form.busy" />
      <div class="form-actions"><v-btn :disabled="form.busy" @click="load">Descartar cambios</v-btn><v-btn type="submit" color="primary" :loading="form.busy">Guardar cambios</v-btn></div>
    </form>
  </section>
</template>
