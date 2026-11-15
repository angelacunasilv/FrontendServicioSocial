import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { ApiError, request, setCsrfToken } from '../lib/api';
import type { Alumno, Respuesta, Usuario } from '../types';

export const useAuthStore = defineStore('auth', () => {
  const usuario = ref<Usuario | null>(null);
  const perfil = ref<Alumno | null>(null);
  const preparado = ref(false);
  const errorInicio = ref('');
  let restoring: Promise<void> | null = null;
  const esAlumno = computed(() => usuario.value?.rol === 'ALU');

  function limpiar() {
    usuario.value = null;
    perfil.value = null;
    setCsrfToken();
  }
  async function restaurar() {
    if (preparado.value) return;
    if (restoring) return restoring;
    restoring = (async () => {
      try {
        const data = await request<Respuesta<Usuario>>('/auth/sesion', { public: true });
        usuario.value = data.datos;
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 401)) errorInicio.value = (error as Error).message;
        limpiar();
      } finally {
        preparado.value = true;
        restoring = null;
      }
    })();
    return restoring;
  }
  async function login(identificador: string, contrasena: string) {
    const response = await request<Respuesta<Usuario>>('/auth/login', {
      method: 'POST', body: { identificador, contrasena }, public: true,
    });
    usuario.value = response.datos;
    preparado.value = true;
    errorInicio.value = '';
    perfil.value = null;
  }
  async function cargarPerfil() {
    if (!esAlumno.value) return;
    const response = await request<Respuesta<Usuario & { perfil: Alumno }>>('/alumnos/me/perfil');
    usuario.value = response.datos;
    perfil.value = response.datos.perfil;
  }
  async function logout() {
    await request<void>('/auth/logout', { method: 'POST' });
    limpiar();
  }
  return { usuario, perfil, preparado, errorInicio, esAlumno, restaurar, login, cargarPerfil, logout, limpiar };
});
