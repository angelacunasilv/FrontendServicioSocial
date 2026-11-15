import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [vue(), vuetify({ autoImport: true })],
    optimizeDeps: { exclude: ['vuetify'] },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: env.API_TARGET || 'http://127.0.0.1:3000',
          changeOrigin: false,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: { vue: ['vue', 'vue-router', 'pinia'] },
        },
      },
    },
  };
});
