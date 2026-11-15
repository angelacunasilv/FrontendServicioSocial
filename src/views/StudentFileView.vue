<script setup lang="ts">
import PageHeading from '../components/PageHeading.vue';
import EmptyState from '../components/EmptyState.vue';
import ExpedientePanel from '../components/ExpedientePanel.vue';
import { useStudentFile } from '../composables/useStudentFile';
const { expediente, busy, error, missing, load } = useStudentFile();
</script>
<template>
  <PageHeading title="Mi expediente" subtitle="Da seguimiento a tu programa, tus horas y tus documentos.">
    <v-btn variant="outlined" prepend-icon="$refresh" :loading="busy" @click="load">Actualizar</v-btn>
  </PageHeading>
  <v-progress-linear v-if="busy" indeterminate color="primary" aria-label="Cargando expediente" />
  <v-alert v-if="error" type="error" role="alert">{{ error }}<v-btn variant="text" @click="load">Reintentar</v-btn></v-alert>
  <EmptyState v-else-if="missing" title="Debe estar registrado en un programa para revisar su expediente"
    text="Selecciona un programa del banco o espera el dictamen de tu propuesta propia." icon="$bank">
    <v-btn to="/programas" color="primary">Consultar programas</v-btn><v-btn to="/propuesta" variant="text">Ver mi propuesta</v-btn>
  </EmptyState>
  <ExpedientePanel v-else-if="expediente" :expediente="expediente" />
</template>
