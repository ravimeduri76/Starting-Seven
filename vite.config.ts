/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Starting-Seven/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
  },
})
