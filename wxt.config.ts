import { defineConfig, ConfigEnv } from 'wxt';
import react from '@vitejs/plugin-react';
import path from 'path';
import { WxtViteConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  vite: (env: ConfigEnv): WxtViteConfig => ({
    plugins: [react()],
    css: {
      postcss: './postcss.config.cjs',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      exclude: ['@vite/client', '@vite/env'],
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
  }),

  extensionApi: 'chrome',
  manifest: {
    permissions: [
      'tabs',
      'activeTab',
      'storage',
      'identity',
      'sidePanel',
      'desktopCapture',
      'scripting',
      'windows',
      '<all_urls>',
    ],
    action: {
      default_title: 'Click to open panel',
    },
    side_panel: {
      default_path: 'popup.html',
    },
  },
});
