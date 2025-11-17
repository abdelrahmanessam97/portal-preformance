import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  css: ["~/assets/css/tailwind.css"],

  vite: {
    plugins: [tailwindcss()],
  },

  modules: ["shadcn-nuxt", "@pinia/nuxt", "@nuxtjs/i18n", "@nuxtjs/google-fonts", "@nuxt/image"],

  // Image optimization settings
  image: {
    quality: 85,
    format: ["webp"],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },

  googleFonts: {
    families: {
      Inter: [300, 400, 500, 600, 700, 800],
    },
    display: "swap",
    prefetch: true,
    preconnect: true,
    preload: true,
  },
  i18n: {
    strategy: "prefix",
    locales: [
      { code: "en", iso: "en-US", file: "en.json", name: "EN", dir: "ltr" },
      { code: "ar", iso: "ar-EG", file: "ar.json", name: "AR", dir: "rtl" },
    ],
  },
  shadcn: {
    prefix: "",
    componentDir: "./app/components/ui",
  },
  app: {
    head: {
      title: "Kandil Internal Portal",
      titleTemplate: "%s · Kandil Internal Portal",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "Kandil Internal Portal" },
      ],
      link: [
        { rel: "icon", type: "image/png", href: "/kandil-logo-sm.png" },
        { rel: "apple-touch-icon", href: "/kandil-logo-sm.png" },
      ],
    },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "https://kandil-portal-api-dev.xyrisdigital.com/api",
    },
  },
});
