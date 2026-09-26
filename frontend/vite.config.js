import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The backend runs on port 5001; Vite forwards API + live-update traffic to it.
const backend = process.env.API_TARGET || 'http://localhost:5001';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Also listen on your Wi-Fi address, so a phone on the same network can scan the QR and open the menu
    host: true,
    proxy: {
      '/api': backend,
      '/socket.io': { target: backend, ws: true },
    },
  },
});
