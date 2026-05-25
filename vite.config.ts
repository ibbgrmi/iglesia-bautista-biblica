import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Pass '' as third arg to loadEnv so it doesn't filter by VITE_ prefix.
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    // Custom domain (iglesia-bautista-biblica.org) is wired via public/CNAME,
    // so we serve from root. Env override exists in case we ever need to fall
    // back to the project path on github.io.
    base: env.VITE_BASE_PATH || '/',
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
