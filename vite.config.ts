import path from 'path';
import { defineConfig, loadEnv } from 'vite';
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        define: {
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        },
        server: {
            allowedHosts: [
                'beec3487adbd.ngrok-free.app',
                'localhost',
                'bot.cashubux.com' // You can also add localhost if needed
            ],
            // Optionally, you can add other server settings like port, cors, etc.
            port: 3000, // Change to your desired port
        },
         build: {
            chunkSizeWarningLimit: 1000, // raise warning threshold to 1000kB
            rollupOptions: {
                onwarn(warning, warn) {
                    if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
                    warn(warning);
                }
            }
        }
    };
});

