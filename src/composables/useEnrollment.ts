import { computed, onMounted, ref } from 'vue';
import { ApiError, request } from '../lib/api';
import { useAuthStore } from '../stores/auth';
import type { Expediente, Programa, Respuesta } from '../types';

export function useEnrollment() {
  const auth = useAuthStore();
  const expediente = ref<Expediente | null>(null);
  const propuesta = ref<Programa | null>(null);
  const busy = ref(true);
  const error = ref('');
  const canSelect = computed(() => !busy.value && !error.value && auth.perfil?.cursoInduccionAcreditado
    && !expediente.value && propuesta.value?.estado !== 'PENDIENTE');
  const reason = computed(() => {
    if (expediente.value) return 'Ya tienes un programa de servicio social asignado. Puedes consultar tu expediente.';
    if (!auth.perfil?.cursoInduccionAcreditado) return 'Debes acreditar el curso de inducción antes de seleccionar un programa.';
    if (propuesta.value?.estado === 'PENDIENTE') return 'Tu propuesta propia está pendiente de revisión.';
    return '';
  });
  async function load() {
    if (!auth.esAlumno) { busy.value = false; return; }
    busy.value = true;
    error.value = '';
    try {
      const results = await Promise.allSettled([
        auth.cargarPerfil(),
        request<Respuesta<Expediente>>('/alumnos/me/expediente').then(response => {
          expediente.value = response.datos;
        }).catch(failure => {
          if (failure instanceof ApiError && failure.codigo === 'EXPEDIENTE_NO_DISPONIBLE') expediente.value = null;
          else throw failure;
        }),
        request<Respuesta<Programa>>('/alumnos/me/propuesta').then(response => {
          propuesta.value = response.datos;
        }).catch(failure => {
          if (failure instanceof ApiError && failure.status === 404) propuesta.value = null;
          else throw failure;
        }),
      ]);
      for (const result of results) if (result.status === 'rejected') throw result.reason;
    } catch (failure) { error.value = (failure as Error).message; }
    finally { busy.value = false; }
  }
  onMounted(load);
  return { expediente, propuesta, busy, error, canSelect, reason, load };
}
