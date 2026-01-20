import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, '../../');
  const env = loadEnv(mode, envDir, '');

  return {
    plugins: [react()],
    envDir,
    server: {
      port: parseInt(env.APP_PORT || '3000'),
    },
    // Ensure Vite optimizes the linked package
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
