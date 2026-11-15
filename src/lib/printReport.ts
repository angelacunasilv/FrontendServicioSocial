import { parse } from 'csv-parse/browser/esm/sync';
import { z } from 'zod';
import { query, request } from './api';

const filasSchema = z.array(z.object({
  numero_control: z.string(),
  nombre_completo: z.string(),
  programa: z.string(),
  periodo: z.string(),
})).min(1).max(10000);
export type FilaImpresion = z.infer<typeof filasSchema>[number];

export async function cargarReporteCompleto(reporte: string, periodo: string, signal: AbortSignal) {
  const path = '/reportes/faltantes' + query({ reporte, periodo, formato: 'csv' });
  const blob = await request<Blob>(path, { blob: true, signal });
  if (!blob.type.startsWith('text/csv')) throw new Error('El reporte no está disponible para impresión');
  const parsed = parse(await blob.text(), { columns: true, bom: true, skip_empty_lines: true });
  const result = filasSchema.safeParse(parsed);
  if (!result.success) throw new Error('El reporte contiene datos inválidos. Vuelve a generar la consulta.');
  return result.data;
}
