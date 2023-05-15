import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: './build'
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
