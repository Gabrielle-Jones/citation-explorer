import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // The base URL should match your repository name
  base: '/citation-explorer/',  // Replace with your repo name
})