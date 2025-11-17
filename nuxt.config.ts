import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  css: ["~/assets/css/tailwind.css"],

  vite: {
    plugins: [tailwindcss()],
    build: {
      cssCodeSplit: true, // Split CSS by route for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["vue", "vue-router", "pinia"],
            ui: ["lucide-vue-next"],
          },
        },
      },
    },
  },

  // Build optimization
  nitro: {
    compressPublicAssets: true, // Compress static assets
    minify: true, // Minify HTML/CSS/JS
  },

  // Experimental features for better performance
  experimental: {
    payloadExtraction: false, // Reduces bundle size
    typedPages: true, // Better TypeScript support
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
      Inter: [400, 500, 600, 700], // Reduced from 6 weights to 4 for better performance
    },
    display: "swap",
    prefetch: true,
    preconnect: true,
    preload: true,
    subsets: ["latin", "arabic"], // Only load needed subsets
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
        { name: "format-detection", content: "telephone=no" }, // Prevent auto-linking phone numbers on iOS
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      ],
      link: [
        { rel: "icon", type: "image/png", href: "/kandil-logo-sm.png" },
        { rel: "apple-touch-icon", href: "/kandil-logo-sm.png" },
        // DNS prefetch for external resources
        { rel: "dns-prefetch", href: "https://fonts.googleapis.com" },
        { rel: "dns-prefetch", href: "https://fonts.gstatic.com" },
      ],
    },
  },

  // Security headers
  routeRules: {
    "/**": {
      headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
      },
    },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "https://kandil-portal-api-dev.xyrisdigital.com/api",
    },
  },
});
