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
  },
})
