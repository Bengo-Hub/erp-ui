import { fileURLToPath, URL } from 'node:url';

import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import Components from 'unplugin-vue-components/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        port: 5216,  // Default port 5173 falls in Windows excluded range (5116-5215)
        strictPort: false  // Allow fallback to next available port
    },
    optimizeDeps: {
        noDiscovery: true
    },
    plugins: [
        nodePolyfills({
            // Specify polyfills for Node.js built-in modules
            globals: {
                crypto: true
                //buffer: true,
                //stream: true
            }
        }),
        vue({
            template: {
                compilerOptions: {
                    // Enable JSX in Vue SFC templates
                    jsx: true
                }
            }
        }),
        vueJsx({
            // Enable JSX in Vue SFC script blocks only
            include: /\.(jsx|js|ts)$/,
            transformOn: true,
            mergeProps: true
        }),
        Components({
            resolvers: [PrimeVueResolver()]
        })
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            crypto: 'crypto-browserify'
        }
    }
});
