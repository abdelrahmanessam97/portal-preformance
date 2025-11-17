declare module 'nuxt/schema' {
  interface NuxtConfig {
    googleFonts?: {
      families?: Record<string, number[] | true>
      display?: string
      prefetch?: boolean
      preconnect?: boolean
      preload?: boolean
    }
  }
  interface NuxtOptions {
    googleFonts?: {
      families?: Record<string, number[] | true>
      display?: string
      prefetch?: boolean
      preconnect?: boolean
      preload?: boolean
    }
  }
}
