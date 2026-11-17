import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the preview under /<repo>/ (D-026); the deploy workflow sets
  // PAGES_BASE_PATH. Local dev, tests and any other build keep the root path.
  base: process.env.PAGES_BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
})
