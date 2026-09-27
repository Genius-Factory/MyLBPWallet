import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Only used by Playwright. The production Vite config never imports this fixture.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@clerk/clerk-react': fileURLToPath(new URL('./clerk.fixture.jsx', import.meta.url)) } },
})