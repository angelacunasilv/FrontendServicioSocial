<script setup lang="ts">
import { ref } from 'vue';
import PageHeading from '../components/PageHeading.vue';
import FileInput from '../components/FileInput.vue';
import FormFields from '../components/FormFields.vue';
import { useForm } from '../composables/useForm';
import { asistenciaSchema } from '../lib/validation';
import { request } from '../lib/api';
import type { Campo, Respuesta } from '../types';
const file = ref<File | null>(null);
const form = useForm(asistenciaSchema, { fechaCurso: '', periodo: '', archivo: null });
const result = ref<{ totalAsistentes: number; curso: { id: number; periodo: string; fechaCurso: string } } | null>(null);
const message = ref('');
const fields: Campo[] = [
  { key: 'fechaCurso', label: 'Fecha del curso', kind: 'date' },
  { key: 'periodo', label: 'Periodo', maxlength: 32, hint: 'Ejemplo 2026-2.' },
];
async function submit() {
  if (form.busy) return;
  form.values.archivo = file.value;
  const data = form.validate();
  if (!data) return;
  form.busy = true;
  result.value = null;
  try {
    const body = new FormData();
    body.set('archivo', data.archivo);
    body.set('fechaCurso', data.fechaCurso);
    body.set('periodo', data.periodo);
    const response = await request<Respuesta<NonNullable<typeof result.value>>>('/induccion/asistencias', { method: 'POST', body });
    result.value = response.datos;
    message.value = response.mensaje ?? '';
    file.value = null;
    form.values.archivo = null;
  } catch (failure) { form.serverError(failure); } finally { form.busy = false; }
}
</script>
<template>
  <PageHeading title="Curso de inducción" subtitle="Acredita la asistencia y habilita la selección de programas para los alumnos." />
  <div class="two-column-content">
    <section class="panel padded">
      <h2 class="mb-5">Cargar lista de asistencia</h2>
      <form novalidate @submit.prevent="submit">
        <v-alert v-if="form.message" type="error" class="mb-5" role="alert">{{ form.message }}</v-alert>
        <FormFields v-model="form.values" :fields="fields" :errors="form.errors" :disabled="form.busy" />
        <FileInput v-model="file" accept=".csv,.xlsx" label="Lista de asistencia *" hint="CSV hasta 10 MiB o Excel .xlsx hasta 1 MiB. Máximo 5 000 alumnos."
          :error="form.errors.archivo" :disabled="form.busy" />
        <div class="form-actions"><v-btn color="primary" type="submit" :loading="form.busy" prepend-icon="$upload">Cargar asistencia</v-btn></div>
      </form>
      <v-alert v-if="result" type="success" class="mt-5" role="status"><strong>{{ message }}</strong>
        <p class="mt-2">Curso #{{ result.curso.id }} · {{ result.curso.periodo }} · {{ result.totalAsistentes }} alumnos acreditados en esta lista.</p></v-alert>
    </section>
    <aside class="instruction-panel"><v-icon icon="$school" color="primary" size="32" /><h2>Prepara tu archivo</h2>
      <p>La primera columna debe contener los números de control. Puedes incluir el encabezado <strong>numero_control</strong>.</p>
      <pre class="csv-example">numero_control
23170060
23170061</pre>
      <p>En Excel usa la primera hoja y conserva los números de control como texto para mantener los ceros iniciales.</p>
      <p>El sistema valida que todos correspondan a alumnos activos antes de acreditar la lista. Las cargas repetidas conservan una sola asistencia por alumno y curso.</p>
    </aside>
  </div>
</template>
