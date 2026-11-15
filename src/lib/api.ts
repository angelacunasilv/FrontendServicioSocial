export interface DetalleError { campo: string; mensaje: string }
export class ApiError extends Error {
  constructor(message: string, public status = 0, public codigo = '', public detalles: DetalleError[] = []) {
    super(message);
  }
}

let csrfToken: string | undefined;
let onExpired = () => {};
export function configurarSesion(handler: () => void) { onExpired = handler; }
export function setCsrfToken(token?: string) { csrfToken = token; }

function apiPath(path: string) {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) throw new Error('Ruta de API inválida');
  return path.startsWith('/api/') ? path : '/api' + path;
}

export async function request<T>(path: string, options: {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  blob?: boolean;
  public?: boolean;
} = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const headers = new Headers();
  const multipart = options.body instanceof FormData;
  if (options.body !== undefined && !multipart) headers.set('Content-Type', 'application/json');
  if (method !== 'GET' && csrfToken && !options.public) headers.set('X-CSRF-Token', csrfToken);
  const timeout = AbortSignal.timeout(30000);
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
  let response: Response;
  try {
    response = await fetch(apiPath(path), {
      method, headers, credentials: 'include',
      body: options.body === undefined ? undefined : multipart ? options.body as FormData : JSON.stringify(options.body),
      signal,
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    if (timeout.aborted) throw new ApiError('El servicio tardó demasiado en responder. Intenta de nuevo.');
    throw new ApiError('No se pudo conectar con el servicio. Comprueba tu conexión e intenta de nuevo.');
  }
  if (response.status === 204) return undefined as T;
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const details = Array.isArray(payload?.error?.detalles)
      ? payload.error.detalles.filter((value: unknown): value is DetalleError =>
        typeof value === 'object' && value !== null && 'campo' in value && 'mensaje' in value)
      : [];
    if (response.status === 401 && !options.public && csrfToken) onExpired();
    const error = new ApiError(payload?.error?.mensaje ?? 'No se pudo completar la solicitud. Intenta de nuevo.',
      response.status, payload?.error?.codigo ?? '', details);
    if (payload?.error?.codigo === 'ALUMNOS_NO_ENCONTRADOS') {
      error.message += '. ' + payload.error.detalles.join(', ');
    }
    throw error;
  }
  if (options.blob) {
    if (response.headers.get('Content-Type')?.includes('application/json')) {
      const payload = await response.json();
      throw new ApiError(payload.mensaje ?? 'El archivo no se encuentra disponible');
    }
    return await response.blob() as T;
  }
  const payload = await response.json().catch(() => {
    throw new ApiError('El servicio devolvió una respuesta inesperada.');
  });
  if (payload.csrfToken) setCsrfToken(payload.csrfToken);
  return payload as T;
}

export function query(values: Record<string, unknown>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) params.set(key, String(value));
  });
  const result = params.toString();
  return result ? '?' + result : '';
}

export async function descargar(path: string, nombre: string) {
  const blob = await request<Blob>(path, { blob: true });
  if (!['application/pdf', 'text/csv'].some(type => blob.type.startsWith(type))) {
    throw new ApiError('El archivo no se encuentra disponible');
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombre;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
