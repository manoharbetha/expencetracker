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
});
