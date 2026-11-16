# Frontend de Servicio Social

**Actividad:** Proyecto final: Sistema de Servicio Social.

**Institución:** Tecnológico Nacional de México, Campus Culiacán.

**Integrantes:**

- Acuña Silva Angel Gabriel
- Bojórquez Chávez Yamil Santiago
- Osuna Perez Enrique
- Borboa Verdugo Jose Angel
- Urrea Cabanillas Hazael

## Qué contiene

Interfaz web para alumnos, Servicio Social, Vinculación y administración.
Usa Vue 3, TypeScript, Pinia, Vue Router, Vuetify y CSS.
El color institucional es `#1B396A`.

La aplicación del homelab está en https://laquieromuchomirna.lol.
El backend está en otro repositorio:
[BackEndServicioSocial](https://github.com/angelacunasilv/BackEndServicioSocial).

## Instalación local

Necesitas Node.js 24, npm y el backend en ejecución.
Abre una terminal en la carpeta que contiene este `package.json`.

```sh
npm ci
cp .env.example .env
npm run dev
```

Abre http://localhost:5173. Si PowerShell bloquea `npm`, usa `npm.cmd`.
En una instalación que ya tenga `.env`, conserva sus valores.

El archivo `.env` permite definir:

| Variable | Valor local |
| --- | --- |
| `API_TARGET` | `http://127.0.0.1:3000` |
| `VITE_INSTITUTIONAL_DOMAIN` | `culiacan.tecnm.mx` |

El navegador consulta `/api`. Vite reenvía esas solicitudes al backend.
En producción Nginx hace ese trabajo. No hace falta `VITE_API_URL`.
La API informa el dominio institucional y las horas requeridas.

## Acceso y funciones

Se usa número de control, ID de usuario o correo registrado y contraseña.
Las cuentas las crea el administrador. No hay credenciales públicas de acceso.

| Rol | Secciones |
| --- | --- |
| Alumno | Perfil, programas, propuesta, documentos, formatos y expediente. |
| Servicio Social | Inducción, programas, formatos, revisiones y faltantes. |
| Vinculación | Consulta de expedientes y emisión de constancias. |
| Administrador | Altas, edición, bajas y reactivación de usuarios. |

Para habilitar a un alumno, Servicio Social entra a **Curso de inducción**
y carga su número de control en una lista CSV o XLSX. Después, el alumno
puede elegir un programa con cupo. El periodo puede escribirse como `2026-2`.

Los formularios muestran campos obligatorios y errores de validación.
Zod valida datos antes de enviarlos; el backend vuelve a revisar permisos,
archivos y reglas del trámite. La navegación también se restringe por rol.

La sesión usa una cookie HttpOnly. Pinia conserva el usuario y el token CSRF
en memoria. El cliente envía la cookie y el token al realizar cambios.

## Organización

| Carpeta | Uso |
| --- | --- |
| `src/views` | Pantallas por función. |
| `src/components` | Formularios, tablas y elementos reutilizables. |
| `src/stores` | Estado de sesión, configuración y avisos con Pinia. |
| `src/composables` | Lógica compartida de formularios y consultas. |
| `src/lib` | Cliente del API y validaciones. |
| `src/styles` | Estilos CSS. |

## Comprobar y compilar

```sh
npm run lint
npm run build
npm run preview
```

La compilación queda en `dist`. La vista previa usa el puerto 5173:
detén primero el servidor de desarrollo si ya usa ese puerto.

## Docker y GitHub Actions

El Dockerfile compila Vue con Node.js 24 y sirve los archivos con Nginx.
Nginx permite abrir las rutas de Vue directamente y reenvía `/api` al
servicio `api` del mismo Compose.

El homelab guarda el despliegue completo en `/srv/serviciosocial`.
Cloudflare Tunnel publica el dominio HTTPS y conecta con Nginx en el puerto 8080.

El workflow revisa lint y compilación. En `main` publica la imagen y actualiza
solo el frontend. La configuración de ambos repositorios está en
[DEPLOYMENT.md](DEPLOYMENT.md).

La revisión específica contra la rúbrica del frontend se agregará cuando
se comparta. La documentación de la API y la evaluación del backend están
en su repositorio correspondiente.
