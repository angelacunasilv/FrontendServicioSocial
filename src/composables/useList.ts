import { computed, onScopeDispose, ref, watch } from 'vue';
import { request, query } from '../lib/api';
import type { Pagina } from '../types';

export function useList<T>(path: string, filters: () => Record<string, unknown> = () => ({})) {
  const rows = ref<T[]>([]);
  const total = ref(0);
  const page = ref(1);
  const busy = ref(false);
  const error = ref('');
  const limit = 10;
  let controller: AbortController | undefined;
  const params = computed(() => JSON.stringify(filters()));

  async function load() {
    controller?.abort();
    const current = new AbortController();
    controller = current;
    busy.value = true;
    error.value = '';
    try {
      const response = await request<Pagina<T>>(path + query({ ...filters(), pagina: page.value, limite: limit }), { signal: current.signal });
      if (current.signal.aborted) return;
      rows.value = response.datos as typeof rows.value;
      total.value = response.paginacion.total;
      if (!rows.value.length && page.value > 1 && total.value > 0) page.value--;
    } catch (failure) {
      if (current.signal.aborted) return;
      error.value = (failure as Error).message;
      rows.value = [];
      total.value = 0;
    } finally {
      if (!current.signal.aborted) busy.value = false;
    }
  }
  watch(params, () => { page.value = 1; });
  watch([page, params], load, { immediate: true });
  onScopeDispose(() => controller?.abort());
  return { rows, total, page, busy, error, limit, load };
}
