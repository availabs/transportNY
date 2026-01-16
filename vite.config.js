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
          if (id.includes('node_modules')) {
            return 'vendor'; // This will put all node_modules into a single 'vendor.js' chunk
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
