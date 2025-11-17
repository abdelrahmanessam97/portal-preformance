<!-- app/pages/index.vue -->
<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { usePermissions } from "~/composables/usePermissions";

// Import hero section immediately (above-the-fold, critical for LCP)
import HomeHeroSection from "~/components/home/HomeHeroSection.vue";

// Lazy load below-the-fold components for better initial page load
const HomeDateSection = defineAsyncComponent(() => import("~/components/home/HomeDateSection.vue"));
const HomeNewsAndAnnouncementsSection = defineAsyncComponent(() => import("~/components/home/HomeNewsAndAnnouncementsSection.vue"));
const HomeNotesSection = defineAsyncComponent(() => import("~/components/home/HomeNotesSection.vue"));

const { canRead } = usePermissions();
const { locale } = useI18n();
const route = useRoute();
const config = useRuntimeConfig();

const pageTitle = "Home - Kandil Internal Portal";
const pageDescription = "Welcome to Kandil Internal Portal. Manage your notes, news, announcements, and reminders in one place.";
const siteUrl = config.public.apiBase?.replace("/api", "") || "";
const canonicalUrl = `${siteUrl}${route.path}`;
const ogImage = `${siteUrl}/hero-bg.jpg`;

// Structured Data (JSON-LD) for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Kandil Internal Portal",
  description: pageDescription,
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

useHead({
  title: pageTitle,
  meta: [
    {
      name: "description",
      content: pageDescription,
    },
    {
      property: "og:title",
      content: pageTitle,
    },
    {
      property: "og:description",
      content: pageDescription,
    },
    {
      property: "og:type",
      content: "website",
    },
    {
      property: "og:url",
      content: canonicalUrl,
    },
    {
      property: "og:image",
      content: ogImage,
    },
    {
      property: "og:image:width",
      content: "1200",
    },
    {
      property: "og:image:height",
      content: "630",
    },
    {
      property: "og:site_name",
      content: "Kandil Internal Portal",
    },
    {
      property: "og:locale",
      content: locale.value === "ar" ? "ar_EG" : "en_US",
    },
    {
      name: "twitter:card",
      content: "summary_large_image",
    },
    {
      name: "twitter:title",
      content: pageTitle,
    },
    {
      name: "twitter:description",
      content: pageDescription,
    },
    {
      name: "twitter:image",
      content: ogImage,
    },
    {
      name: "viewport",
      content: "width=device-width, initial-scale=1",
    },
    {
      name: "theme-color",
      content: "#007795",
    },
  ],
  link: [
    {
      rel: "canonical",
      href: canonicalUrl,
    },
    {
      rel: "preconnect",
      href: "https://fonts.googleapis.com",
    },
    {
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
      crossorigin: "",
    },
  ],
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify(structuredData),
    },
  ],
  htmlAttrs: {
    lang: locale.value || "en",
  },
});

definePageMeta({
  layout: "default",
});
</script>

<template>
  <main class="space-y-8 md:space-y-12 w-full mb-14">
    <HomeHeroSection />

    <ClientOnly>
      <HomeDateSection />
      <template #fallback>
        <!-- optional placeholder to keep layout stable -->
        <div aria-hidden="true" class="h-12" />
      </template>
    </ClientOnly>

    <HomeNewsAndAnnouncementsSection v-if="canRead('news')" />
    <HomeNotesSection />
  </main>
</template>
