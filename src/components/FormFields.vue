<script setup lang="ts">
import SelectField from './SelectField.vue';
import type { Campo, Valores } from '../types';
const values = defineModel<Valores>({ required: true });
defineProps<{ fields: Campo[]; errors: Record<string, string>; disabled?: boolean }>();
</script>

<template>
  <div class="form-grid">
    <div v-for="field in fields" :key="field.key" :class="{ 'field-full': field.full }">
      <SelectField v-if="field.kind === 'select'" v-model="values[field.key]" :label="field.label + (field.optional ? ' (opcional)' : ' *')"
        :items="field.items ?? []" :error-messages="errors[field.key]" :disabled="disabled" :name="field.key"
        :hint="field.hint" :persistent-hint="Boolean(field.hint)" />
      <v-textarea v-else-if="field.kind === 'textarea'" v-model="values[field.key]" :label="field.label + ' *'"
        :maxlength="field.maxlength" :error-messages="errors[field.key]" :disabled="disabled" :name="field.key" />
      <v-text-field v-else v-model="values[field.key]" :label="field.label + (field.optional ? ' (opcional)' : ' *')"
        :type="field.kind ?? 'text'" :inputmode="field.kind === 'number' ? 'numeric' : undefined"
        :min="field.min" :max="field.max" :step="field.kind === 'number' ? 1 : undefined" :maxlength="field.maxlength"
        :autocomplete="field.autocomplete ?? (field.kind === 'password' ? 'new-password' : 'off')"
        :error-messages="errors[field.key]" :hint="field.hint" :persistent-hint="Boolean(field.hint)"
        :disabled="disabled" :name="field.key" />
    </div>
  </div>
</template>
