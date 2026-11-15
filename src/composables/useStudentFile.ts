import { onMounted, ref } from 'vue';
import { ApiError, request } from '../lib/api';
import type { Expediente, Respuesta } from '../types';
export function useStudentFile() {
  const expediente = ref<Expediente | null>(null);
  const busy = ref(true);
  const error = ref('');
  const missing = ref(false);
  async function load() {
    busy.value = true;
    error.value = '';
    missing.value = false;
    try { expediente.value = (await request<Respuesta<Expediente>>('/alumnos/me/expediente')).datos; }
    catch (failure) {
      expediente.value = null;
      if (failure instanceof ApiError && failure.codigo === 'EXPEDIENTE_NO_DISPONIBLE') missing.value = true;
      else error.value = (failure as Error).message;
    } finally { busy.value = false; }
  }
  onMounted(load);
  return { expediente, busy, error, missing, load };
}
