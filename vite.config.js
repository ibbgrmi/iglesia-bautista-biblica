import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// https://vitejs.dev/config/
export default defineConfig(function (_a) {
    var mode = _a.mode;
    // Pass '' as third arg to loadEnv so it doesn't filter by VITE_ prefix.
    var env = loadEnv(mode, '.', '');
    return {
        plugins: [react()],
        // GitHub Pages serves at /<repo-name>/ until we point a custom domain at it.
        // After CNAME swap, set VITE_BASE_PATH=/ in .env.production and redeploy.
        base: env.VITE_BASE_PATH || '/iglesia-bautista-biblica/',
        build: {
            outDir: 'dist',
            sourcemap: false,
        },
    };
});
