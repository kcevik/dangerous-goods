import { fileURLToPath } from 'node:url'
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
        overrides: {
          // tests never talk to Supabase — every test mocks useSupabaseClient —
          // but the module warns at boot if url/key are unset
          supabase: {
            url: 'https://test.supabase.co',
            key: 'test-anon-key',
          },
        },
      },
    },
  },
})
