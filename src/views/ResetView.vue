<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AuthLayout from '../layouts/AuthLayout.vue';
import { useForm } from '../composables/useForm';
import { resetSchema } from '../lib/validation';
import { request } from '../lib/api';
import { useUiStore } from '../stores/ui';
const route = useRoute();
const router = useRouter();
const token = ref(new URLSearchParams(route.hash.slice(1)).get('token') ?? '');
if (route.hash) window.history.replaceState(window.history.state, '', route.path);
const form = useForm(resetSchema, { contrasena: '', confirmarContrasena: '' });
async function submit() {
  if (form.busy) return;
  const data = form.validate();
  if (!data || !/^[a-f0-9]{64}$/.test(token.value)) return;
  form.busy = true;
  try {
    await request('/auth/restablecer', { method: 'POST', body: { token: token.value, contrasena: data.contrasena }, public: true });
    token.value = '';
    form.values.contrasena = '';
    form.values.confirmarContrasena = '';
    useUiStore().notificar('Contraseña restablecida correctamente');
    await router.replace('/iniciar-sesion');
  } catch (error) { form.serverError(error); } finally { form.busy = false; }
}
</script>
<template>
  <AuthLayout>
    <div class="auth-secondary"><h2>Restablecer contraseña</h2><p>Elige una nueva contraseña de al menos 12 caracteres.</p></div>
    <v-alert v-if="!/^[a-f0-9]{64}$/.test(token)" type="warning" role="alert">El enlace es inválido o ha vencido. Solicita un nuevo enlace de recuperación.</v-alert>
    <form v-else novalidate @submit.prevent="submit">
      <v-alert v-if="form.message" type="error" class="mb-4" role="alert">{{ form.message }}</v-alert>
      <v-text-field v-model="form.values.contrasena" label="Nueva contraseña *" type="password" name="contrasena"
        autocomplete="new-password" maxlength="128" :error-messages="form.errors.contrasena" :disabled="form.busy" />
      <v-text-field v-model="form.values.confirmarContrasena" label="Confirmar nueva contraseña *" type="password"
        name="confirmarContrasena" autocomplete="new-password" maxlength="128" :error-messages="form.errors.confirmarContrasena" :disabled="form.busy" />
      <v-btn color="primary" block type="submit" :loading="form.busy">Guardar nueva contraseña</v-btn>
    </form>
    <router-link to="/recuperar-contrasena" class="auth-back">Solicitar otro enlace</router-link>
  </AuthLayout>
</template>
