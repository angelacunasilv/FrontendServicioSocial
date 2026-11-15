import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import vuetify from './plugins/vuetify';
import { configurarSesion } from './lib/api';
import { useAuthStore } from './stores/auth';
import { useUiStore } from './stores/ui';
import './styles/main.css';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(vuetify);
const auth = useAuthStore(pinia);
configurarSesion(() => {
  if (!auth.usuario) return;
  auth.limpiar();
  useUiStore(pinia).notificar('Tu sesión terminó. Inicia sesión para continuar.', 'info');
  void router.replace({ name: 'login' });
});
app.use(router);
app.mount('#app');
