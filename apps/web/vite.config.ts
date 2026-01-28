import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, '../../');
  const env = loadEnv(mode, envDir, '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'process.env': Object.keys(env).reduce(
        (acc, key) => {
          if (key.startsWith('VITE_') || key === 'NODE_ENV') {
            acc[key] = env[key];
          }
          return acc;
        },
        {} as Record<string, string>,
      ),
    },
    envDir,
    server: {
      port: parseInt(env.APP_PORT || '3000'),
    },
    optimizeDeps: {
      include: ['@repo/common', '@repo/env'],
    },
    build: {
      commonjsOptions: {
        include: [/common/, /node_modules/],
      },
    },
  };
});
