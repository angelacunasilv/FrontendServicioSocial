<script setup lang="ts">
import { ref } from 'vue';
import AuthLayout from '../layouts/AuthLayout.vue';
import { useForm } from '../composables/useForm';
import { recuperarSchema } from '../lib/validation';
import { request } from '../lib/api';
import type { Respuesta } from '../types';
const form = useForm(recuperarSchema, { correo: '' });
const success = ref('');
async function submit() {
  if (form.busy) return;
  const data = form.validate();
  if (!data) return;
  form.busy = true;
  success.value = '';
  try {
    const response = await request<Respuesta<never>>('/auth/recuperar', { method: 'POST', body: data, public: true });
    success.value = response.mensaje ?? 'Correo de recuperación de contraseña enviado al correo proporcionado';
  } catch (error) { form.serverError(error); } finally { form.busy = false; }
}
</script>
<template>
  <AuthLayout>
    <div class="auth-secondary"><h2>Recuperar contraseña</h2><p>Escribe el correo institucional de tu cuenta de alumno. Te enviaremos un enlace de recuperación.</p></div>
    <form novalidate @submit.prevent="submit">
      <v-alert v-if="form.message" type="error" class="mb-4" role="alert">{{ form.message }}</v-alert>
      <v-alert v-if="success" type="success" class="mb-4" role="status">{{ success }}</v-alert>
      <v-text-field v-model="form.values.correo" label="Correo institucional *" type="email" name="correo"
        autocomplete="email" maxlength="254" :error-messages="form.errors.correo" :disabled="form.busy" />
      <v-btn block color="primary" type="submit" :loading="form.busy">Enviar enlace de recuperación</v-btn>
      <router-link to="/iniciar-sesion" class="auth-back">Volver a iniciar sesión</router-link>
    </form>
  </AuthLayout>
</template>
