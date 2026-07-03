import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: {
        name: 'Expense Tracker',
        short_name: 'Expense',
        description: 'Track expenses and achieve financial goals.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone'
      }
    })
  ],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('framer-motion'))
            return 'chunk-motion';
          if (id.includes('recharts') || id.includes('d3'))
            return 'chunk-charts';
          if (id.includes('node_modules'))
            return 'chunk-vendor';
        },
      },
    },
  },
});
