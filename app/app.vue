<template>
  <Toaster :expand="true" rich-colors />

  <!-- Global full-page loader -->
  <PageLoader :show="isLoading" />

  <NuxtLayout>
    <NuxtPage :key="$route.fullPath" />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Toaster } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useHead, onNuxtReady } from "#imports"
import { ref, watch } from "vue"
import { useRouter } from "vue-router"
import PageLoader from "~/components/global/PageLoader.vue"
import "vue-sonner/style.css"

const isLoading = ref(true)
const router = useRouter()

// Helper to hide loader gracefully
const hideLoader = (delay = 500) => {
  setTimeout(() => (isLoading.value = false), delay)
}

// Show loader until Nuxt DOM + hydration ready
onNuxtReady(() => hideLoader())

// Route navigation loader
router.beforeEach(() => {
  isLoading.value = true
})
router.afterEach(() => hideLoader())

// Handle language direction
const { locale, locales } = useI18n()
const setHtmlAttributes = () => {
  const currentLocale = locales.value.find((l) => l.code === locale.value)
  const direction = currentLocale?.dir || "ltr"
  useHead({ htmlAttrs: { dir: direction, lang: locale.value } })
}
setHtmlAttributes()
watch(locale, setHtmlAttributes, { immediate: true })
</script>
