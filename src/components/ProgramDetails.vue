<script setup lang="ts">
import type { Programa } from '../types';
defineProps<{ programa: Programa }>();
</script>
<template>
  <dl class="details-grid">
    <div><dt>Área o departamento</dt><dd>{{ programa.area }}</dd></div>
    <div><dt>Periodo</dt><dd>{{ programa.periodo }}</dd></div>
    <div><dt>Persona titular</dt><dd>{{ programa.nombreTitular }}<small>{{ programa.puestoTitular }}</small></dd></div>
    <div><dt>Responsable del programa</dt><dd>{{ programa.nombreResponsable }}<small>{{ programa.puestoResponsable }}</small></dd></div>
    <div v-if="programa.objetivo" class="field-full"><dt>Objetivo</dt><dd>{{ programa.objetivo }}</dd></div>
    <div class="field-full"><dt>Actividades</dt><dd>{{ programa.actividades }}</dd></div>
    <div v-if="programa.tipo === 'INTERNO'"><dt>Cupo disponible / total</dt><dd>{{ programa.cupoDisponible }} / {{ programa.cupo }}</dd></div>
    <div v-if="programa.horario"><dt>Horario</dt><dd>{{ programa.horario }}</dd></div>
    <div><dt>Teléfono de contacto</dt><dd>{{ programa.telefono }}</dd></div>
    <div><dt>Correo de contacto</dt><dd>{{ programa.correo }}</dd></div>
    <div class="field-full"><dt>Domicilio</dt><dd>{{ programa.domicilio }}</dd></div>
  </dl>
</template>
