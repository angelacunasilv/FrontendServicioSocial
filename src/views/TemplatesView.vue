<script setup lang="ts">
import SelectField from '../components/SelectField.vue';
import { onMounted, ref } from 'vue';
import PageHeading from '../components/PageHeading.vue';
import FileInput from '../components/FileInput.vue';
import PdfPreview from '../components/PdfPreview.vue';
import { useAuthStore } from '../stores/auth';
import { useUiStore } from '../stores/ui';
import { useForm } from '../composables/useForm';
import { comprobarPdf, plantillaSchema } from '../lib/validation';
import { tiposDocumento } from '../lib/catalogos';
import { descargar, request } from '../lib/api';
import type { Respuesta, TipoDocumento } from '../types';
const auth = useAuthStore();
const available = ref<TipoDocumento[]>([]);
const busy = ref(true);
const error = ref('');
const downloading = ref('');
const preview = ref<string | null>(null);
const modal = ref(false);
const file = ref<File | null>(null);
const form = useForm(plantillaSchema, { tipo: '', archivo: null });
async function load() {
  busy.value = true;
  error.value = '';
  try {
    const response = await request<Respuesta<{ tipo: TipoDocumento }[]>>('/plantillas');
    available.value = response.datos.map(item => item.tipo);
  } catch (failure) { error.value = (failure as Error).message; } finally { busy.value = false; }
}
onMounted(load);
async function download(tipo: string) {
  if (downloading.value) return;
  downloading.value = tipo;
  try { await descargar('/plantillas/' + tipo, tipo.toLowerCase() + '.pdf'); }
  catch (failure) { useUiStore().notificar((failure as Error).message, 'error'); } finally { downloading.value = ''; }
}
function open(tipo: string) { form.reset({ tipo, archivo: null }); file.value = null; modal.value = true; }
async function save() {
  if (form.busy) return;
  form.values.archivo = file.value;
  const data = form.validate();
  if (!data) return;
  form.busy = true;
  try {
    try { await comprobarPdf(data.archivo); } catch (failure) { form.errors.archivo = (failure as Error).message; return; }
    const body = new FormData();
    body.set('tipo', data.tipo);
    body.set('archivo', data.archivo);
    await request('/plantillas', { method: 'PUT', body });
    modal.value = false;
    file.value = null;
    useUiStore().notificar('Plantilla guardada');
    await load();
  } catch (failure) { form.serverError(failure); } finally { form.busy = false; }
}
</script>
<template>
  <PageHeading title="Formatos oficiales" subtitle="Descarga las plantillas publicadas por la Oficina de Servicio Social.">
    <v-btn variant="outlined" prepend-icon="$refresh" :loading="busy" @click="load">Actualizar</v-btn>
  </PageHeading>
  <v-alert v-if="auth.usuario?.rol === 'JSS'" type="info" class="mb-5">Publica aquí los archivos PDF institucionales que utilizarán los alumnos para sus entregas.</v-alert>
  <section class="panel">
    <v-progress-linear v-if="busy" indeterminate color="primary" aria-label="Cargando formatos" />
    <v-alert v-if="error" type="error" class="ma-5" role="alert">{{ error }}<v-btn variant="text" @click="load">Reintentar</v-btn></v-alert>
    <v-table v-else class="data-table"><thead><tr><th>Formato</th><th>Disponibilidad</th><th class="align-right">Acciones</th></tr></thead>
      <tbody><tr v-for="tipo in tiposDocumento" :key="tipo.value"><td><div class="document-title"><v-icon icon="$pdf" color="primary" /><strong>{{ tipo.title }}</strong></div></td>
        <td>{{ available.includes(tipo.value) ? 'Disponible en PDF' : 'Pendiente de publicación' }}</td>
        <td class="align-right"><div class="row-actions">
          <v-btn size="small" variant="text" :disabled="!available.includes(tipo.value)" @click="preview = '/plantillas/' + tipo.value">Vista previa</v-btn>
          <v-btn size="small" variant="outlined" prepend-icon="$download" :loading="downloading === tipo.value" :disabled="!available.includes(tipo.value)" @click="download(tipo.value)">Descargar</v-btn>
          <v-btn v-if="auth.usuario?.rol === 'JSS'" size="small" color="primary" @click="open(tipo.value)">{{ available.includes(tipo.value) ? 'Reemplazar' : 'Publicar' }}</v-btn>
        </div></td></tr></tbody>
    </v-table>
  </section>
  <p class="muted mt-4">Si el archivo que necesitas está pendiente de publicación, solicita apoyo a la Oficina de Servicio Social.</p>
  <v-dialog aria-label="Publicar formato oficial" v-model="modal" max-width="520" :persistent="form.busy"><v-card title="Publicar formato oficial">
    <form novalidate @submit.prevent="save"><v-card-text>
      <v-alert v-if="form.message" type="error" role="alert" class="mb-5">{{ form.message }}</v-alert>
      <SelectField v-model="form.values.tipo" label="Tipo de formato *" :items="tiposDocumento" name="tipo" :error-messages="form.errors.tipo" :disabled="form.busy" />
      <FileInput v-model="file" :error="form.errors.archivo" :disabled="form.busy" />
    </v-card-text><v-card-actions><v-spacer /><v-btn :disabled="form.busy" @click="modal = false">Cancelar</v-btn><v-btn type="submit" color="primary" variant="flat" :loading="form.busy">Publicar formato</v-btn></v-card-actions></form>
  </v-card></v-dialog>
  <PdfPreview v-model="preview" title="Formato oficial" />
</template>
