<script setup lang="ts">
import { useId } from 'vue';
const titleId = useId();
const open = defineModel<boolean>({ required: true });
withDefaults(defineProps<{ title: string; text: string; busy?: boolean; action?: string; danger?: boolean; error?: string }>(), { action: 'Confirmar' });
defineEmits<{ confirm: [] }>();
</script>
<template>
  <v-dialog v-model="open" max-width="460" :persistent="busy" :aria-labelledby="titleId">
    <v-card>
      <v-card-title :id="titleId">{{ title }}</v-card-title>
      <v-card-text><p>{{ text }}</p><v-alert v-if="error" type="error" class="mt-4" role="alert">{{ error }}</v-alert></v-card-text>
      <v-card-actions><v-spacer /><v-btn :disabled="busy" @click="open = false">Cancelar</v-btn>
        <v-btn :color="danger ? 'error' : 'primary'" variant="flat" :loading="busy" @click="$emit('confirm')">{{ action }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
