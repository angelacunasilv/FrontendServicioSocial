import { nextTick, reactive } from 'vue';
import { z } from 'zod';
import { ApiError } from '../lib/api';
import type { Valores } from '../types';

export function useForm<T extends z.ZodType>(schema: T, initial: Valores) {
  const state = reactive({ values: { ...initial } as Valores, errors: {} as Record<string, string>, message: '', busy: false });

  function enfocarError() {
    void nextTick(() => {
      const dialog = document.querySelector('.v-dialog.v-overlay--active');
      const invalid = (dialog ?? document).querySelector<HTMLElement>('[aria-invalid="true"], .v-input--error input, .v-input--error textarea');
      invalid?.focus();
    });
  }
  function validate(): z.output<T> | null {
    state.errors = {};
    state.message = '';
    const result = schema.safeParse(state.values);
    if (result.success) return result.data;
    for (const issue of result.error.issues) {
      const campo = issue.path.join('.');
      if (campo) state.errors[campo] ??= issue.message;
      else state.message ||= issue.message;
    }
    if (!state.message) state.message = 'Revise los campos indicados';
    enfocarError();
    return null;
  }
  function serverError(error: unknown) {
    state.message = error instanceof Error ? error.message : 'No se pudo completar la operación';
    if (error instanceof ApiError) {
      if (error.codigo === 'CONTRASENA_INCORRECTA') state.errors.contrasenaActual = error.message;
      for (const detail of error.detalles) state.errors[detail.campo] = detail.mensaje;
    }
    enfocarError();
  }
  function reset(values: Valores = initial) {
    state.values = { ...values };
    state.errors = {};
    state.message = '';
  }
  return Object.assign(state, { validate, serverError, reset });
}
