import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const aviso = ref('');
  const tipo = ref<'success' | 'error' | 'info'>('success');
  const visible = ref(false);
  function notificar(mensaje: string, color: 'success' | 'error' | 'info' = 'success') {
    aviso.value = mensaje;
    tipo.value = color;
    visible.value = true;
  }
  return { aviso, tipo, visible, notificar };
});
