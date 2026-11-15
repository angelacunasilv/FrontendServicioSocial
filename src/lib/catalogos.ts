import type { Campo, Rol, TipoDocumento } from '../types';

export const roles: { title: string; value: Rol }[] = [
  { title: 'Alumno', value: 'ALU' },
  { title: 'Jefe de Oficina de Servicio Social', value: 'JSS' },
  { title: 'Jefe de Departamento de Vinculación', value: 'JDV' },
  { title: 'Administrador del sistema', value: 'ADM' },
];
export const rolNombre = (rol?: Rol) => roles.find(item => item.value === rol)?.title ?? '';
export const tiposDocumento: { title: string; value: TipoDocumento }[] = [
  { title: 'Solicitud de servicio social', value: 'SOLICITUD' },
  { title: 'Carta de aceptación', value: 'CARTA_ACEPTACION' },
  { title: 'Reporte bimestral', value: 'REPORTE_BIMESTRAL' },
  { title: 'Informe final', value: 'REPORTE_FINAL' },
  { title: 'Carta de terminación', value: 'CARTA_TERMINACION' },
];
export function nombreDocumento(tipo: TipoDocumento, numero?: number | null) {
  const nombre = tiposDocumento.find(item => item.value === tipo)?.title ?? tipo;
  return numero ? nombre + ' ' + numero : nombre;
}
export const estados = [
  { title: 'Pendiente de revisión', value: 'PENDIENTE' },
  { title: 'Aceptado', value: 'ACEPTADO' },
  { title: 'Rechazado', value: 'RECHAZADO' },
];
export const fecha = (value: string) => new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium', timeZone: 'America/Mazatlan',
}).format(new Date(value));

export const camposContacto: Campo[] = [
  { key: 'area', label: 'Área o departamento', maxlength: 160, full: true },
  { key: 'nombreTitular', label: 'Nombre de la persona titular', maxlength: 160 },
  { key: 'puestoTitular', label: 'Puesto de la persona titular', maxlength: 160 },
  { key: 'nombreResponsable', label: 'Nombre de la persona responsable', maxlength: 160 },
  { key: 'puestoResponsable', label: 'Puesto de la persona responsable', maxlength: 160 },
  { key: 'actividades', label: 'Actividades a realizar', kind: 'textarea', maxlength: 4000, full: true },
  { key: 'telefono', label: 'Teléfono de contacto', maxlength: 24, autocomplete: 'tel' },
  { key: 'correo', label: 'Correo de contacto', kind: 'email', maxlength: 254, autocomplete: 'email' },
  { key: 'domicilio', label: 'Domicilio', maxlength: 300, full: true, autocomplete: 'street-address' },
];
export const camposInterno: Campo[] = [
  { key: 'nombreProyecto', label: 'Nombre del proyecto', maxlength: 200, full: true },
  ...camposContacto,
  { key: 'objetivo', label: 'Objetivo', kind: 'textarea', maxlength: 2000, full: true },
  { key: 'cupo', label: 'Cupo total del programa', kind: 'number', min: 1, max: 100000 },
  { key: 'horario', label: 'Horario requerido', maxlength: 160 },
  { key: 'periodo', label: 'Periodo', optional: true, maxlength: 32, hint: 'Ejemplo 2026-2. Se asigna el periodo actual si se omite.' },
];
export const camposExterno: Campo[] = [
  { key: 'nombreEmpresa', label: 'Nombre de la empresa o dependencia', maxlength: 200, full: true },
  ...camposContacto,
];
