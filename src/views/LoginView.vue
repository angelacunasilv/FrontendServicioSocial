<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AuthLayout from '../layouts/AuthLayout.vue';
import { useForm } from '../composables/useForm';
import { accesoSchema } from '../lib/validation';
import { useAuthStore } from '../stores/auth';
const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const showPassword = ref(false);
const support = ref(false);
const form = useForm(accesoSchema, { identificador: '', contrasena: '' });
async function submit() {
  if (form.busy) return;
  const data = form.validate();
  if (!data) return;
  form.busy = true;
  try {
    await auth.login(data.identificador, data.contrasena);
    form.values.contrasena = '';
    let destination = '/inicio';
    try {
      const requested = new URL(String(route.query.continuar ?? '/inicio'), window.location.origin);
      if (requested.origin === window.location.origin) destination = requested.pathname + requested.search + requested.hash;
    } catch {
      // Una dirección de retorno inválida lleva al inicio de la aplicación.
    }
    await router.replace(destination);
  } catch (error) {
    form.serverError(error);
  } finally { form.busy = false; }
}
</script>
<template>
  <AuthLayout>
    <p class="login-welcome">Bienvenido, ingresa tus credenciales para acceder a la<br class="desktop-only" /> plataforma</p>
    <div class="institutional-access"><v-icon icon="$lock" size="12" /> Acceso con cuenta institucional</div>
    <div class="login-separator"><span>Credenciales</span></div>
    <form class="login-form" novalidate @submit.prevent="submit">
      <v-alert v-if="form.message || auth.errorInicio" type="error" class="login-error" role="alert">{{ form.message || auth.errorInicio }}</v-alert>
      <label for="identificador">Número de control, usuario o correo institucional</label>
      <v-text-field id="identificador" v-model="form.values.identificador" aria-label="Número de control, usuario o correo institucional"
        name="identificador" autocomplete="username" maxlength="254" :error-messages="form.errors.identificador"
        :disabled="form.busy" hide-details="auto" />
      <label for="contrasena">Contraseña</label>
      <v-text-field id="contrasena" v-model="form.values.contrasena" aria-label="Contraseña"
        name="contrasena" autocomplete="current-password" maxlength="128" :type="showPassword ? 'text' : 'password'"
        :error-messages="form.errors.contrasena" :disabled="form.busy" hide-details="auto">
        <template #append-inner><button type="button" :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
          class="password-toggle" @click="showPassword = !showPassword"><v-icon :icon="showPassword ? '$eyeOff' : '$eye'" size="14" /></button></template>
      </v-text-field>
      <v-btn class="login-submit" color="primary" block type="submit" :loading="form.busy">Iniciar sesión</v-btn>
      <router-link to="/recuperar-contrasena" class="recovery-link">¿Olvidaste tu contraseña?</router-link>
    </form>
    <div class="login-support"><v-btn block color="#E1E2E3" @click="support = true"><span class="support-question">?</span> Soporte AMBAR</v-btn></div>
    <v-dialog aria-label="Soporte AMBAR" v-model="support" max-width="450"><v-card title="Soporte AMBAR"><v-card-text>
      <p>Si eres alumno, puedes recuperar tu contraseña con el correo institucional registrado.</p>
      <p class="mt-3">Si tu cuenta está inactiva o perteneces al personal del plantel, solicita ayuda al administrador del sistema. Para dudas sobre tus documentos, acude a la Oficina de Servicio Social.</p>
    </v-card-text><v-card-actions><v-spacer /><v-btn color="primary" @click="support = false">Cerrar</v-btn></v-card-actions></v-card></v-dialog>
  </AuthLayout>
</template>
