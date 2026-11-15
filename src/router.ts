import { createRouter, createWebHistory } from 'vue-router';
import type { Rol } from './types';
import { useAuthStore } from './stores/auth';
import { useUiStore } from './stores/ui';
import { cargarConfiguracion } from './stores/configuracion';

declare module 'vue-router' {
  interface RouteMeta { title?: string; public?: boolean; roles?: Rol[] }
}
const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/iniciar-sesion', name: 'login', component: () => import('./views/LoginView.vue'), meta: { public: true, title: 'Iniciar sesión' } },
    { path: '/recuperar-contrasena', name: 'recover', component: () => import('./views/RecoveryView.vue'), meta: { public: true, title: 'Recuperar contraseña' } },
    { path: '/restablecer-contrasena', name: 'reset', component: () => import('./views/ResetView.vue'), meta: { public: true, title: 'Restablecer contraseña' } },
    {
      path: '/', component: () => import('./layouts/AppLayout.vue'),
      children: [
        { path: '', redirect: '/inicio' },
        { path: 'inicio', name: 'home', component: () => import('./views/HomeView.vue'), meta: { title: 'Inicio' } },
        { path: 'perfil', component: () => import('./views/ProfileView.vue'), meta: { roles: ['ALU'], title: 'Datos personales' } },
        { path: 'programas', component: () => import('./views/ProgramsView.vue'), meta: { roles: ['ALU', 'JSS'], title: 'Banco de programas' } },
        { path: 'propuesta', component: () => import('./views/ProposalView.vue'), meta: { roles: ['ALU'], title: 'Propuesta propia' } },
        { path: 'expediente', component: () => import('./views/StudentFileView.vue'), meta: { roles: ['ALU'], title: 'Mi expediente' } },
        { path: 'documentos', component: () => import('./views/UploadView.vue'), meta: { roles: ['ALU'], title: 'Subir documentos' } },
        { path: 'formatos', component: () => import('./views/TemplatesView.vue'), meta: { roles: ['ALU', 'JSS'], title: 'Formatos oficiales' } },
        { path: 'induccion', component: () => import('./views/InductionView.vue'), meta: { roles: ['JSS'], title: 'Curso de inducción' } },
        { path: 'revision-propuestas', component: () => import('./views/ReviewView.vue'), props: { kind: 'propuestas' }, meta: { roles: ['JSS'], title: 'Revisar propuestas' } },
        { path: 'revision-documentos', component: () => import('./views/ReviewView.vue'), props: { kind: 'documentos' }, meta: { roles: ['JSS'], title: 'Revisar documentos' } },
        { path: 'reportes', component: () => import('./views/ReportsView.vue'), meta: { roles: ['JSS'], title: 'Reportes de faltantes' } },
        { path: 'reportes/imprimir', component: () => import('./views/ReportPrintView.vue'), meta: { roles: ['JSS'], title: 'Vista de impresión' } },
        { path: 'expedientes', component: () => import('./views/StaffFilesView.vue'), meta: { roles: ['JDV'], title: 'Consultar expedientes' } },
        { path: 'constancias', component: () => import('./views/CertificatesView.vue'), meta: { roles: ['JDV'], title: 'Constancias de terminación' } },
        { path: 'usuarios', component: () => import('./views/UsersView.vue'), meta: { roles: ['ADM'], title: 'Gestión de usuarios' } },
        { path: 'ayuda', component: () => import('./views/HelpView.vue'), meta: { title: 'Guía de uso' } },
      ],
    },
    { path: '/:pathMatch(.*)*', component: () => import('./views/NotFoundView.vue'), meta: { public: true, title: 'Página no encontrada' } },
  ],
});

router.beforeEach(async to => {
  const auth = useAuthStore();
  await Promise.all([auth.restaurar(), cargarConfiguracion()]);
  if (!to.meta.public && !auth.usuario) return { name: 'login', query: { continuar: to.fullPath } };
  if (auth.usuario && ['login', 'recover', 'reset'].includes(String(to.name))) return { name: 'home' };
  if (to.meta.roles && auth.usuario && !to.meta.roles.includes(auth.usuario.rol)) {
    useUiStore().notificar('Tu cuenta no tiene acceso a esta sección.', 'info');
    return { name: 'home' };
  }
});
router.afterEach(to => { document.title = (to.meta.title ?? 'Servicio social') + ' · AMBAR Culiacán'; });
router.onError(() => { useUiStore().notificar('No se pudo cargar la página. Comprueba tu conexión y vuelve a intentarlo.', 'error'); });
export default router;
