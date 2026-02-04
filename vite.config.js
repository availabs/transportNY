import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),  tailwindcss()],
  build: {
    outDir: './build',
    rollupOptions: {
      output: {
        // You can define a manualChunks function for custom splitting
        manualChunks: (id) => {
          if (id.includes('maplibre-gl')) {
            return 'maplibre';
          } else if (id.includes('dms')) {
            return 'dms';
          } else if (id.includes('mapbox-gl')) {
            return 'mapbox';
          } else if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    }
  },
  resolve: {
    alias: [
      { find: '~', replacement: path.resolve(__dirname, 'src') },
    ],
  },
  define: {
      //global: {},
      //global: '({})',
      'process.env' : {}
  },
})
