import { z } from 'zod';
import { configuracion } from '../stores/configuracion';

export const obligatorio = 'Este campo es obligatorio';
const requerido = { error: obligatorio };
export const texto = (max: number) => z.string(requerido).trim().min(1, requerido).max(max, 'El máximo es de ' + max + ' caracteres')
  .refine(value => !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u.test(value), 'El campo contiene caracteres de control');
const correo = texto(254).toLowerCase().pipe(z.email({ error: 'Correo electrónico inválido' }));
export const correoInstitucional = correo.refine(
  value => !configuracion.dominioInstitucional || value.endsWith('@' + configuracion.dominioInstitucional),
  'Ingrese un correo institucional válido',
);
export const identificador = texto(32).toUpperCase().regex(/^[A-Z0-9][A-Z0-9._-]*$/, 'Identificador inválido');
const telefono = texto(24).regex(/^\+?[\d() -]{7,24}$/, 'Teléfono inválido')
  .refine(value => { const digits = value.replace(/\D/g, '').length; return digits >= 7 && digits <= 15; }, 'Teléfono inválido');
const password = z.string(requerido).min(1, requerido).max(128, 'El máximo es de 128 caracteres')
  .refine(value => value.trim().length > 0, requerido);
export const nuevaPassword = password.min(12, 'La contraseña debe tener al menos 12 caracteres');
const esVacio = (value: unknown) => value === '' || value === undefined || value === null;
const opcional = (schema: z.ZodType) => z.preprocess(value => esVacio(value) ? undefined : value, schema.optional());
export const entero = (min: number, max: number, message = 'Ingrese un número entero válido') =>
  z.preprocess(value => {
    if (typeof value !== 'string') return value;
    if (!value.trim()) return undefined;
    return /^-?\d+$/.test(value.trim()) ? Number(value) : value;
  }, z.int({ error: issue => issue.input === undefined ? obligatorio : message }).min(min, message).max(max, message));
export const accesoSchema = z.object({ identificador: texto(254), contrasena: password });
export const recuperarSchema = z.object({ correo: correoInstitucional });
export const resetSchema = z.object({
  contrasena: nuevaPassword, confirmarContrasena: password,
}).refine(data => data.contrasena === data.confirmarContrasena, {
  path: ['confirmarContrasena'], message: 'Las contraseñas no coinciden',
});
export const perfilSchema = z.object({
  nombre: texto(100), apellidos: z.string().trim().max(120), telefono: opcional(telefono),
  contrasenaActual: password, nuevaContrasena: opcional(nuevaPassword), confirmarContrasena: opcional(password),
}).refine(data => data.nuevaContrasena === data.confirmarContrasena, {
  path: ['confirmarContrasena'], message: 'Las contraseñas no coinciden',
});
const datosUsuario = {
  identificador, nombreCompleto: texto(221), correo: correoInstitucional,
  rol: z.enum(['ALU', 'JSS', 'JDV', 'ADM'], requerido),
  contrasena: opcional(nuevaPassword), carrera: opcional(texto(120)),
  semestre: opcional(entero(1, 20)), planEstudios: opcional(texto(120)), departamento: opcional(texto(120)),
};
export const usuarioSchema = z.object(datosUsuario);
const contacto = {
  area: texto(160), nombreTitular: texto(160), puestoTitular: texto(160),
  nombreResponsable: texto(160), puestoResponsable: texto(160),
  actividades: texto(4000), telefono, correo, domicilio: texto(300),
};
export const internoSchema = z.object({
  ...contacto, nombreProyecto: texto(200), objetivo: texto(2000), horario: texto(160),
  cupo: entero(1, 100000, 'El cupo debe ser mayor a 0'), periodo: opcional(texto(32)),
});
export const externoSchema = z.object({ ...contacto, nombreEmpresa: texto(200) });
export const revisionSchema = z.object({
  estado: z.enum(['ACEPTADO', 'RECHAZADO'], requerido), observaciones: z.string().trim().max(2000),
}).superRefine((value, ctx) => {
  if (value.estado === 'RECHAZADO' && !value.observaciones) {
    ctx.addIssue({ code: 'custom', path: ['observaciones'], message: 'El apartado de observaciones no puede estar vacío' });
  }
});
export const archivoRequerido = z.custom<File>(value => value instanceof File, requerido);
export const pdfSchema = archivoRequerido.refine(file => /\.pdf$/i.test(file.name)
  && (!file.type || ['application/pdf', 'application/octet-stream'].includes(file.type)),
  'El archivo debe estar en formato PDF')
  .refine(file => file.size > 0, 'El archivo está vacío')
  .refine(file => file.size <= 10 * 1024 * 1024, 'El archivo supera el límite de 10 MiB');
export const tipos = ['SOLICITUD', 'CARTA_ACEPTACION', 'REPORTE_BIMESTRAL', 'REPORTE_FINAL', 'CARTA_TERMINACION'] as const;
export const documentoSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('REPORTE_BIMESTRAL'), archivo: pdfSchema, numeroReporte: entero(1, 3), horas: entero(0, 10000) }),
  z.object({ tipo: z.literal('REPORTE_FINAL'), archivo: pdfSchema, horas: entero(0, 10000) }),
  z.object({ tipo: z.enum(['SOLICITUD', 'CARTA_ACEPTACION', 'CARTA_TERMINACION']), archivo: pdfSchema }),
], { error: issue => {
  const tipo = (issue.input as { tipo?: unknown } | undefined)?.tipo;
  return esVacio(tipo) ? obligatorio : 'Tipo de documento inválido';
} });
export const plantillaSchema = z.object({ tipo: z.enum(tipos, requerido), archivo: pdfSchema });
export const asistenciaSchema = z.object({
  periodo: texto(32), fechaCurso: texto(10).pipe(z.iso.date({ error: 'Ingrese una fecha válida' })),
  archivo: archivoRequerido.refine(file => /\.(csv|xlsx)$/i.test(file.name),
    'Formato de archivo no válido. Suba un archivo Excel o CSV')
    .refine(file => file.size > 0, 'El archivo está vacío')
    .refine(file => file.size <= (/\.xlsx$/i.test(file.name) ? 1024 * 1024 : 10 * 1024 * 1024),
      'El máximo es de 1 MiB para Excel y 10 MiB para CSV'),
});
export const buscarAlumnoSchema = z.object({ numeroControl: identificador });
export const faltantesSchema = z.object({
  reporte: z.enum(['1', '2', '3', 'final'], requerido), periodo: opcional(texto(32)),
});

export async function comprobarPdf(file: File) {
  const firma = await file.slice(0, 8).text();
  const final = await file.slice(-1024).text();
  if (!/^%PDF-\d\.\d/.test(firma) || !/%%EOF\s*$/.test(final)) {
    throw new Error('El archivo debe estar en formato PDF');
  }
}
