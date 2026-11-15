<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import PageHeading from '../components/PageHeading.vue';
import StatusChip from '../components/StatusChip.vue';
import { useAuthStore } from '../stores/auth';
import { rolNombre } from '../lib/catalogos';
const auth = useAuthStore();
const busy = ref(false);
const error = ref('');
const links = computed(() => {
  switch (auth.usuario?.rol) {
    case 'ALU': return [
      { title: 'Banco de programas', text: 'Encuentra tu programa de servicio social.', to: '/programas', icon: '$bank' },
      { title: 'Mi expediente', text: 'Consulta tus entregas y observaciones.', to: '/expediente', icon: '$document' },
      { title: 'Subir documentos', text: 'Entrega tus cartas y reportes en PDF.', to: '/documentos', icon: '$upload' },
    ];
    case 'JSS': return [
      { title: 'Curso de inducción', text: 'Acredita la asistencia de los alumnos.', to: '/induccion', icon: '$school' },
      { title: 'Revisar propuestas', text: 'Da seguimiento a las propuestas propias.', to: '/revision-propuestas', icon: '$company' },
      { title: 'Revisar documentos', text: 'Valida cartas, informes y reportes.', to: '/revision-documentos', icon: '$review' },
    ];
    case 'JDV': return [
      { title: 'Consultar expedientes', text: 'Revisa las entregas de cada alumno.', to: '/expedientes', icon: '$document' },
      { title: 'Emitir constancias', text: 'Genera la constancia de terminación.', to: '/constancias', icon: '$certificate' },
    ];
    default: return [
      { title: 'Gestión de usuarios', text: 'Crea accesos y administra los roles del sistema.', to: '/usuarios', icon: '$users' },
      { title: 'Guía de uso', text: 'Consulta las funciones de cada rol.', to: '/ayuda', icon: '$help' },
    ];
  }
});
async function load() {
  if (!auth.esAlumno) return;
  busy.value = true;
  error.value = '';
  try { await auth.cargarPerfil(); } catch (failure) { error.value = (failure as Error).message; }
  finally { busy.value = false; }
}
onMounted(load);
</script>
<template>
  <PageHeading title="Inicio" subtitle="Bienvenido al sistema de gestión del servicio social." />
  <v-alert v-if="error" type="error" class="mb-5" role="alert">{{ error }} <v-btn variant="text" @click="load">Reintentar</v-btn></v-alert>
  <div class="home-content">
    <div class="home-notice"><v-icon icon="$school" size="19" /><span>{{ rolNombre(auth.usuario?.rol) }} · Campus Culiacán</span></div>
    <section class="identification panel">
      <h2>Identificación</h2>
      <div class="identity-body"><div class="identity-avatar"><v-icon icon="$user" size="64" aria-hidden="true" /></div>
        <div class="identity-info"><h3>{{ auth.usuario?.nombreCompleto }}</h3><p>{{ auth.usuario?.identificador }} · {{ auth.usuario?.correo }}</p>
          <div class="identity-grid"><div><span>Rol institucional</span><strong>{{ rolNombre(auth.usuario?.rol) }}</strong></div>
            <div v-if="auth.esAlumno"><span>Carrera</span><strong>{{ auth.perfil?.carrera || 'Por registrar' }}</strong></div>
            <div v-if="auth.esAlumno"><span>Semestre</span><strong>{{ auth.perfil?.semestre || 'Por registrar' }}</strong></div>
            <div><span>Estatus de la cuenta</span><StatusChip value="ACTIVO" /></div>
          </div>
        </div>
      </div>
      <v-progress-linear v-if="busy" indeterminate color="primary" aria-label="Cargando identificación" />
    </section>
    <v-alert v-if="auth.esAlumno && auth.perfil" :type="auth.perfil.cursoInduccionAcreditado ? 'success' : 'info'" class="mb-6">
      {{ auth.perfil.cursoInduccionAcreditado ? 'Curso de inducción acreditado. Puedes seleccionar un programa.' : 'Para seleccionar un programa, la Oficina de Servicio Social debe acreditar tu asistencia al curso de inducción.' }}
    </v-alert>
    <h2 class="section-title">Servicio social</h2>
    <div class="quick-links"><router-link v-for="link in links" :key="link.to" :to="link.to" class="quick-link">
      <v-icon :icon="link.icon" size="24" /><div><h3>{{ link.title }}</h3><p>{{ link.text }}</p></div><v-icon icon="$chevron" size="18" />
    </router-link></div>
  </div>
</template>
