<script setup lang="ts">
import { ref } from 'vue';
import PageHeading from '../components/PageHeading.vue';
import ExpedientePanel from '../components/ExpedientePanel.vue';
import { useForm } from '../composables/useForm';
import { buscarAlumnoSchema } from '../lib/validation';
import { request, query } from '../lib/api';
import type { Expediente, Respuesta, Usuario } from '../types';
const form = useForm(buscarAlumnoSchema, { numeroControl: '' });
const result = ref<{ alumno: Usuario; expediente: Expediente } | null>(null);
async function submit() {
  if (form.busy) return;
  const data = form.validate();
  if (!data) return;
  result.value = null;
  form.busy = true;
  try { result.value = (await request<Respuesta<NonNullable<typeof result.value>>>('/expedientes' + query(data))).datos; }
  catch (failure) { form.serverError(failure); } finally { form.busy = false; }
}
</script>
<template>
  <PageHeading title="Consultar expedientes" subtitle="Busca a un alumno por su número de control para consultar su progreso y sus entregas." />
  <section class="panel padded mb-6"><form novalidate @submit.prevent="submit">
    <v-alert v-if="form.message" type="error" role="alert" class="mb-5">{{ form.message }}</v-alert>
    <div class="search-form"><v-text-field v-model="form.values.numeroControl" label="Número de control *" name="numeroControl" maxlength="32"
      :error-messages="form.errors.numeroControl" :disabled="form.busy" /><v-btn type="submit" color="primary" prepend-icon="$search" :loading="form.busy">Consultar expediente</v-btn></div>
  </form></section>
  <template v-if="result"><div class="student-result"><div><h2>{{ result.alumno.nombreCompleto }}</h2><p>{{ result.alumno.identificador }} · {{ result.alumno.correo }}</p></div>
    <v-btn color="primary" variant="outlined" :to="{ path: '/constancias', query: { numeroControl: result.alumno.identificador } }">Ir a constancia</v-btn></div>
    <ExpedientePanel :expediente="result.expediente" />
  </template>
</template>
