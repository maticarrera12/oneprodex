import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    typecheck: { tsconfig: './tsconfig.test.json' },
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    // Run in UTC like Vercel so timezone bugs surface locally too
    env: { TZ: 'UTC' },
  },
})
