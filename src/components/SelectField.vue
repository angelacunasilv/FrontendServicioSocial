<script setup lang="ts">
import { computed, useId } from 'vue';
const value = defineModel<unknown>({ required: true });
const props = withDefaults(defineProps<{
  label: string;
  items: { title: string; value: string | number }[];
  errorMessages?: string | string[];
  disabled?: boolean;
  name?: string;
  hint?: string;
  persistentHint?: boolean;
  hideDetails?: boolean | 'auto';
  allowEmpty?: boolean;
}>(), { errorMessages: '', hint: '', allowEmpty: true });
const id = 'select-' + useId();
const errors = computed(() => Array.isArray(props.errorMessages) ? props.errorMessages.filter(Boolean) : props.errorMessages ? [props.errorMessages] : []);
const detailsVisible = computed(() => !props.hideDetails || props.hideDetails === 'auto' && errors.value.length > 0);
function update(event: Event) {
  const selected = (event.target as HTMLSelectElement).value;
  value.value = props.items.find(item => String(item.value) === selected)?.value ?? '';
}
</script>
<template>
  <div class="select-field" :class="{ 'select-field-error': errors.length, 'select-field-disabled': disabled }">
    <div class="select-field-control">
      <label :for="id">{{ label }}</label>
      <select :id="id" :name="name" :value="value ?? ''" :disabled="disabled"
        :aria-invalid="errors.length ? 'true' : undefined" :aria-describedby="detailsVisible ? id + '-details' : undefined" @change="update">
        <option v-if="allowEmpty" value="">Selecciona una opción</option>
        <option v-for="item in items" :key="item.value" :value="item.value">{{ item.title }}</option>
      </select>
      <v-icon icon="$down" size="18" class="select-field-icon" aria-hidden="true" />
    </div>
    <div v-if="detailsVisible" :id="id + '-details'" class="select-field-details">
      <p v-if="errors.length" role="alert">{{ errors[0] }}</p><p v-else-if="hint && persistentHint">{{ hint }}</p>
    </div>
  </div>
</template>
