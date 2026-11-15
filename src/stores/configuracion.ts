import { reactive } from 'vue';
import { request } from '../lib/api';
import type { Respuesta } from '../types';

export const configuracion = reactive({
  dominioInstitucional: import.meta.env.VITE_INSTITUTIONAL_DOMAIN || '',
  horasRequeridas: 0,
});
let cargada = false;
export async function cargarConfiguracion() {
  if (cargada) return;
  try {
    const response = await request<Respuesta<typeof configuracion>>('/configuracion', { public: true });
    Object.assign(configuracion, response.datos);
    cargada = true;
  } catch {
    // La pantalla de acceso comunica los problemas de conexión y permite reintentar.
  }
}
