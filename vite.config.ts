import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { defaultClientConditions } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
  },
  // Svelte ships separate client/server builds; tests mount components in
  // jsdom, so resolve the browser entry points even though Vitest runs in Node.
  resolve: process.env.VITEST
    ? { conditions: ['browser', ...defaultClientConditions] }
    : undefined,
})
