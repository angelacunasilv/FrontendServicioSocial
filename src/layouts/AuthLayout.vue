<script setup lang="ts">
import { ref } from 'vue';
const privacy = ref(false);
</script>
<template>
  <main class="auth-page">
    <div class="auth-column">
      <section class="auth-card">
        <img class="login-logo" src="/logo-tecnm.png" alt="Tecnológico Nacional de México" width="200" height="91" />
        <div class="login-brand"><h1>AMBAR SERVICIO SOCIAL</h1><p>CULIACÁN</p></div>
        <slot />
      </section>
      <p class="auth-footer">© {{ new Date().getFullYear() }} Servicio social · <button type="button" @click="privacy = true">Privacidad</button></p>
    </div>
    <v-dialog aria-label="Uso de tus datos" v-model="privacy" max-width="480">
      <v-card title="Uso de tus datos"><v-card-text>
        <p>Tu cuenta, tus datos de contacto y tus documentos se utilizan para gestionar el servicio social. El acceso a cada expediente está limitado a su titular y a las jefaturas autorizadas.</p>
        <p class="mt-3">Cierra tu sesión al terminar, especialmente si utilizas un equipo compartido. Puedes consultar el aviso de privacidad institucional con el plantel.</p>
      </v-card-text><v-card-actions><v-spacer /><v-btn color="primary" @click="privacy = false">Entendido</v-btn></v-card-actions></v-card>
    </v-dialog>
  </main>
</template>
