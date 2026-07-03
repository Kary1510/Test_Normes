import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          supabase: ['@supabase/supabase-js'],
          socket: ['socket.io-client'],
        },
      },
    },
  },
})
