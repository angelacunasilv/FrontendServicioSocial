export type Rol = 'ALU' | 'JSS' | 'JDV' | 'ADM';
export type Estado = 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO' | 'SIN_ENTREGA';
export type TipoDocumento = 'SOLICITUD' | 'CARTA_ACEPTACION' | 'REPORTE_BIMESTRAL' | 'REPORTE_FINAL' | 'CARTA_TERMINACION';

export interface Alumno {
  usuarioId: number;
  nombre: string;
  apellidos: string;
  carrera: string | null;
  semestre: number | null;
  telefono: string | null;
  planEstudios: string | null;
  cursoInduccionAcreditado: boolean;
}
export interface Usuario {
  id: number;
  identificador: string;
  nombreCompleto: string;
  correo: string;
  rol: Rol;
  activo: boolean;
  fechaCreacion: string;
  perfil?: Alumno | { departamento: string | null };
}
export interface Programa {
  id: number;
  tipo: 'INTERNO' | 'EXTERNO';
  nombreProyecto: string;
  area: string;
  nombreTitular: string;
  puestoTitular: string;
  nombreResponsable: string;
  puestoResponsable: string;
  actividades: string;
  telefono: string;
  correo: string;
  domicilio: string;
  periodo: string;
  objetivo: string | null;
  horario: string | null;
  cupo: number | null;
  cupoDisponible: number | null;
  activo: boolean;
  estado: Estado;
  observaciones: string | null;
  adjunto: boolean;
  fechaEnvio: string;
  autor?: { identificador: string; nombreCompleto: string };
}
export interface Documento {
  id: number;
  expedienteId: number;
  tipo: TipoDocumento;
  numeroReporte: number | null;
  horas: number | null;
  nombreArchivo: string;
  tamano: number;
  estado: Estado;
  observaciones: string | null;
  fechaSubida: string;
  expediente?: { alumno: { usuario: Pick<Usuario, 'identificador' | 'nombreCompleto'> } };
}
export interface Entrega {
  tipo: TipoDocumento;
  numeroReporte: number | null;
  estado: Estado;
  documento: Documento | null;
}
export interface Expediente {
  id: number;
  programaId: number;
  avanceHoras: number;
  porcentajeAvance: number;
  estadoGlobal: 'INSCRITO' | 'TERMINADO';
  fechaInscripcion: string;
  programa: Pick<Programa, 'id' | 'nombreProyecto' | 'tipo' | 'periodo'>;
  entregas: Entrega[];
}
export interface Respuesta<T> { datos: T; mensaje?: string; csrfToken?: string }
export interface Pagina<T> extends Respuesta<T[]> {
  paginacion: { pagina: number; limite: number; total: number };
}
export interface Campo {
  key: string;
  label: string;
  kind?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'date';
  items?: { title: string; value: string | number }[];
  max?: number;
  min?: number;
  maxlength?: number;
  optional?: boolean;
  full?: boolean;
  hint?: string;
  autocomplete?: string;
}
export type Valores = Record<string, unknown>;
