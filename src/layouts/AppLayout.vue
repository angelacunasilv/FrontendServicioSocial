<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { useRoute, useRouter } from 'vue-router';
import { rolNombre } from '../lib/catalogos';
import { useAuthStore } from '../stores/auth';
import { useUiStore } from '../stores/ui';
import type { Rol } from '../types';
const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const { mobile } = useDisplay();
const drawer = ref(!mobile.value);
const exiting = ref(false);
const accountDialog = ref(false);
const filter = ref('');
const items: { title: string; to: string; icon: string; roles?: Rol[] }[] = [
  { title: 'Inicio', to: '/inicio', icon: '$home' },
  { title: 'Datos personales', to: '/perfil', icon: '$user', roles: ['ALU'] },
  { title: 'Banco de programas', to: '/programas', icon: '$bank', roles: ['ALU', 'JSS'] },
  { title: 'Propuesta propia', to: '/propuesta', icon: '$company', roles: ['ALU'] },
  { title: 'Mi expediente', to: '/expediente', icon: '$document', roles: ['ALU'] },
  { title: 'Subir documentos', to: '/documentos', icon: '$upload', roles: ['ALU'] },
  { title: 'Formatos oficiales', to: '/formatos', icon: '$download', roles: ['ALU', 'JSS'] },
  { title: 'Curso de inducción', to: '/induccion', icon: '$school', roles: ['JSS'] },
  { title: 'Revisar propuestas', to: '/revision-propuestas', icon: '$company', roles: ['JSS'] },
  { title: 'Revisar documentos', to: '/revision-documentos', icon: '$review', roles: ['JSS'] },
  { title: 'Reportes de faltantes', to: '/reportes', icon: '$report', roles: ['JSS'] },
  { title: 'Consultar expedientes', to: '/expedientes', icon: '$document', roles: ['JDV'] },
  { title: 'Emitir constancias', to: '/constancias', icon: '$certificate', roles: ['JDV'] },
  { title: 'Gestión de usuarios', to: '/usuarios', icon: '$users', roles: ['ADM'] },
];
const menu = computed(() => items.filter(item => (!item.roles || (auth.usuario && item.roles.includes(auth.usuario.rol)))
  && item.title.toLocaleLowerCase('es').includes((filter.value ?? '').toLocaleLowerCase('es'))));
watch(mobile, value => { drawer.value = !value; });
watch(() => route.path, () => { if (mobile.value) drawer.value = false; });
async function logout() {
  if (exiting.value) return;
  exiting.value = true;
  try { await auth.logout(); accountDialog.value = false; await router.replace('/iniciar-sesion'); }
  catch (error) { useUiStore().notificar((error as Error).message, 'error'); }
  finally { exiting.value = false; }
}
</script>
<template>
  <a href="#main-content" class="skip-link">Ir al contenido</a>
  <v-app-bar class="institutional-header" color="primary" height="48" elevation="1">
    <v-btn icon="$menu" variant="text" aria-label="Mostrar u ocultar menú" :aria-expanded="drawer" @click="drawer = !drawer" />
    <router-link to="/inicio" class="header-brand"><img src="/logo-tecnm.png" alt="Tecnológico Nacional de México" width="110" height="40" /></router-link>
    <span class="header-system">SERVICIO SOCIAL</span><v-spacer />
    <span class="header-role">{{ rolNombre(auth.usuario?.rol) }}</span>
    <v-btn icon="$account" variant="text" aria-label="Opciones de mi cuenta" @click="accountDialog = true" />
    <v-dialog v-model="accountDialog" max-width="450" aria-label="Mi cuenta">
      <v-card title="Mi cuenta"><v-card-text>
        <h3>{{ auth.usuario?.nombreCompleto }}</h3>
        <p class="muted mt-2">{{ auth.usuario?.identificador }} · {{ rolNombre(auth.usuario?.rol) }}</p>
        <p class="muted">{{ auth.usuario?.correo }}</p>
      </v-card-text><v-card-actions><v-btn variant="text" @click="accountDialog = false">Cerrar</v-btn>
        <v-btn v-if="auth.esAlumno" to="/perfil" @click="accountDialog = false">Datos personales</v-btn>
        <v-spacer /><v-btn color="primary" variant="flat" :loading="exiting" @click="logout">Cerrar sesión</v-btn>
      </v-card-actions></v-card>
    </v-dialog>

  </v-app-bar>
  <v-navigation-drawer v-model="drawer" :temporary="mobile" :permanent="!mobile && drawer" width="218" class="sidebar">
    <div class="menu-search"><v-text-field v-model="filter" placeholder="Buscar en el menú" aria-label="Buscar en el menú"
      prepend-inner-icon="$search" hide-details clearable density="compact" @click:clear="filter = ''" /></div>
    <p class="sidebar-caption">SERVICIO SOCIAL</p>
    <v-list nav density="compact" class="sidebar-links"><v-list-item v-for="item in menu" :key="item.to" :to="item.to"
      :prepend-icon="item.icon" :title="item.title" :exact="true" />
      <p v-if="!menu.length" class="muted pa-3">Sin coincidencias</p></v-list>
    <template #append><div class="sidebar-footer"><v-list nav density="compact">
      <v-list-item to="/ayuda" prepend-icon="$help" title="Guía de uso y soporte" />
      <v-list-item role="button" prepend-icon="$logout" title="Cerrar sesión" :disabled="exiting" @click="logout" />
    </v-list><div class="sidebar-campus">TECNM · CAMPUS CULIACÁN</div></div></template>
  </v-navigation-drawer>
  <v-main><main id="main-content" class="content-wrapper" tabindex="-1">
    <div class="breadcrumbs"><router-link to="/inicio">Inicio</router-link><v-icon icon="$chevron" size="12" /> <span>{{ route.meta.title }}</span></div>
    <router-view :key="route.path" />
    <footer class="app-footer">Tecnológico Nacional de México · Campus Culiacán <span>Sistema de Servicio Social</span></footer>
  </main></v-main>
</template>
