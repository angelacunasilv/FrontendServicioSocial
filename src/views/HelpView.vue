<script setup lang="ts">
import PageHeading from '../components/PageHeading.vue';
import { useAuthStore } from '../stores/auth';
const auth = useAuthStore();
</script>
<template>
  <PageHeading title="Guía de uso y soporte" subtitle="Consulta los pasos y los mensajes de tu trámite de servicio social." />
  <section class="panel padded help-content">
    <template v-if="auth.esAlumno">
      <h2>Tu proceso de servicio social</h2>
      <ol class="process-list"><li><strong>Acredita el curso de inducción.</strong> La oficina registra tu asistencia y habilita la selección de programas.</li>
        <li><strong>Selecciona tu programa.</strong> Puedes inscribirte en un programa institucional con cupo o enviar una propuesta propia.</li>
        <li><strong>Entrega tus documentos.</strong> Descarga los formatos oficiales y sube los documentos completos en PDF.</li>
        <li><strong>Consulta tu expediente.</strong> Revisa los dictámenes, las observaciones y las horas aprobadas. Si hay correcciones, reenvía el documento.</li>
        <li><strong>Concluye tu trámite.</strong> Vinculación emite la constancia cuando tus entregas y horas cumplen los requisitos.</li></ol>
    </template>
    <template v-else-if="auth.usuario?.rol === 'JSS'"><h2>Oficina de Servicio Social</h2><p>Registra las asistencias a la inducción y los programas institucionales. Revisa las propuestas externas y las entregas de los alumnos, y registra las observaciones necesarias para que puedan corregirlas.</p><p class="mt-3">Desde Reportes de faltantes puedes consultar quiénes aún no entregan un reporte, exportar el listado o abrir la vista para imprimirlo. Publica las plantillas oficiales desde Formatos oficiales.</p></template>
    <template v-else-if="auth.usuario?.rol === 'JDV'"><h2>Departamento de Vinculación</h2><p>Consulta el expediente mediante el número de control del alumno. Revisa las entregas aprobadas y el avance de horas antes de emitir su constancia. Puedes descargar o imprimir el PDF desde la pantalla de constancias.</p></template>
    <template v-else><h2>Administración del sistema</h2><p>Da de alta las cuentas con su número de control o ID, nombre completo, correo y rol institucional. La edición permite cambiar el rol, actualizar sus datos y reactivar la cuenta. La baja suspende el acceso y conserva el historial.</p><p class="mt-3">Los cambios en las cuentas invalidan sus sesiones anteriores. El sistema conserva al menos un administrador activo.</p></template>
    <h2 class="mt-8 mb-3">Preguntas frecuentes</h2>
    <v-expansion-panels variant="accordion"><v-expansion-panel title="¿Qué significan los estados de una entrega?"><v-expansion-panel-text>Sin entrega indica un documento pendiente de subir. Pendiente de revisión indica que la oficina recibió el archivo. Aceptado indica que la entrega fue aprobada. Rechazado indica que debes atender las observaciones y subir una versión corregida.</v-expansion-panel-text></v-expansion-panel>
      <v-expansion-panel title="¿Qué archivos se permiten?"><v-expansion-panel-text>Los documentos del expediente y los archivos adjuntos de propuestas deben ser PDF de hasta 10 MiB. Para cargar asistencias, la oficina puede utilizar CSV de hasta 10 MiB o Excel .xlsx de hasta 1 MiB.</v-expansion-panel-text></v-expansion-panel>
      <v-expansion-panel title="¿Por qué terminó mi sesión?"><v-expansion-panel-text>La sesión vence después de ocho horas. También se invalida si se restablece la contraseña o un administrador modifica el acceso. Inicia sesión de nuevo para continuar.</v-expansion-panel-text></v-expansion-panel>
      <v-expansion-panel title="¿A quién solicito ayuda?"><v-expansion-panel-text>Para revisar entregas, cupos o asistencia a la inducción, contacta a la Oficina de Servicio Social. Para una cuenta inactiva o cambios de rol, solicita apoyo al administrador del plantel. Los alumnos pueden recuperar su contraseña desde la pantalla de inicio de sesión.</v-expansion-panel-text></v-expansion-panel>
    </v-expansion-panels>
  </section>
</template>
