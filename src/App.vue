<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { useUiStore } from './stores/ui';
const ui = useUiStore();
const offline = ref(!navigator.onLine);
const connectionChanged = () => { offline.value = !navigator.onLine; };
window.addEventListener('online', connectionChanged);
window.addEventListener('offline', connectionChanged);
onBeforeUnmount(() => {
  window.removeEventListener('online', connectionChanged);
  window.removeEventListener('offline', connectionChanged);
});
</script>
<template>
  <v-app>
    <div v-if="offline" class="offline-banner" role="alert">Sin conexión. Comprueba tu red antes de guardar cambios.</div>
    <router-view />
    <v-snackbar v-model="ui.visible" :color="ui.tipo" location="bottom right" :timeout="6500" role="status">
      {{ ui.aviso }}<template #actions><v-btn icon="$close" aria-label="Cerrar aviso" @click="ui.visible = false" /></template>
    </v-snackbar>
  </v-app>
</template>
