// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["./app/assets/css/main.css"],
  runtimeConfig: {
    // server-only; read from NUXT_SUPABASE_SERVICE_ROLE_KEY at runtime by
    // Nuxt's env-var override convention — never bake the secret at build time
    supabaseServiceRoleKey: "",
  },
  supabase: {
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
      // TODO: remove /search when auth is implemented
      exclude: ["/", "/un/**", "/search"],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  modules: [
    "@nuxt/eslint",
    "@nuxt/image",
    "@nuxt/ui",
    "@nuxtjs/i18n",
    "@nuxtjs/supabase",
  ],
});
