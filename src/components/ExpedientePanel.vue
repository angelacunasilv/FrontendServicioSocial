<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useUiStore } from '../stores/ui';
import { configuracion } from '../stores/configuracion';
import { fecha, nombreDocumento } from '../lib/catalogos';
import { descargar } from '../lib/api';
import type { Expediente } from '../types';
import StatusChip from './StatusChip.vue';
import PdfPreview from './PdfPreview.vue';
const props = defineProps<{ expediente: Expediente }>();
const auth = useAuthStore();
const preview = ref<string | null>(null);
const downloading = ref<number | null>(null);
async function download(id: number) {
  if (downloading.value !== null) return;
  downloading.value = id;
  try { await descargar('/documentos/' + id + '/archivo', 'documento-' + id + '.pdf'); }
  catch (error) { useUiStore().notificar((error as Error).message, 'error'); }
  finally { downloading.value = null; }
}
</script>
<template>
  <section class="panel padded file-summary">
    <div class="panel-heading"><div><span class="eyebrow">Expediente #{{ props.expediente.id }}</span><h2>{{ expediente.programa.nombreProyecto }}</h2>
      <p class="muted">Programa {{ expediente.programa.tipo === 'INTERNO' ? 'interno' : 'externo' }} · Periodo {{ expediente.programa.periodo }} · Inscripción {{ fecha(expediente.fechaInscripcion) }}</p></div>
      <StatusChip :value="expediente.estadoGlobal" /></div>
    <div class="progress-heading"><strong>{{ expediente.avanceHoras }} horas aprobadas</strong><span>{{ Math.round(expediente.porcentajeAvance) }} % de avance</span></div>
    <v-progress-linear :model-value="expediente.porcentajeAvance" height="8" color="primary" rounded aria-label="Avance de horas de servicio social" />
    <p v-if="configuracion.horasRequeridas" class="muted mt-2">Meta de {{ configuracion.horasRequeridas }} horas. Se acumulan las horas aprobadas de los reportes bimestrales y el periodo final.</p>
  </section>
  <section class="panel mt-6">
    <div class="table-toolbar"><div><h2>Documentos del expediente</h2><p>Consulta tus entregas, observaciones y dictámenes.</p></div></div>
    <v-table class="data-table"><thead><tr><th>Documento</th><th>Estado</th><th>Horas</th><th>Observaciones</th><th class="align-right">Acciones</th></tr></thead>
      <tbody><tr v-for="entrega in expediente.entregas" :key="entrega.tipo + ':' + entrega.numeroReporte">
        <td><strong>{{ nombreDocumento(entrega.tipo, entrega.numeroReporte) }}</strong><small v-if="entrega.documento">{{ fecha(entrega.documento.fechaSubida) }}</small></td>
        <td><StatusChip :value="entrega.estado" /></td><td>{{ entrega.documento?.horas ?? '—' }}</td>
        <td class="observations">{{ entrega.documento?.observaciones || '—' }}</td>
        <td class="align-right"><div class="row-actions">
          <template v-if="entrega.documento"><v-btn size="small" variant="text" icon="$eye" :aria-label="'Ver ' + nombreDocumento(entrega.tipo, entrega.numeroReporte)"
            @click="preview = '/documentos/' + entrega.documento!.id + '/archivo'" />
            <v-btn size="small" variant="text" icon="$download" :loading="downloading === entrega.documento.id"
              :aria-label="'Descargar ' + nombreDocumento(entrega.tipo, entrega.numeroReporte)" @click="download(entrega.documento.id)" /></template>
          <v-btn v-if="auth.esAlumno && entrega.estado !== 'ACEPTADO'" size="small" color="primary" variant="tonal"
            :to="{ path: '/documentos', query: { tipo: entrega.tipo, numero: entrega.numeroReporte ?? undefined } }">
            {{ entrega.documento ? 'Reenviar' : 'Subir' }}</v-btn>
        </div></td>
      </tr></tbody>
    </v-table>
  </section>
  <PdfPreview v-model="preview" />
</template>
