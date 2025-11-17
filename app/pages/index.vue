<!-- app/pages/index.vue -->
<script setup lang="ts">
import HomeDateSection from "~/components/home/HomeDateSection.vue";
import HomeHeroSection from "~/components/home/HomeHeroSection.vue";
import HomeNewsAndAnnouncementsSection from "~/components/home/HomeNewsAndAnnouncementsSection.vue";
import HomeNotesSection from "~/components/home/HomeNotesSection.vue";
import { usePermissions } from "~/composables/usePermissions";

const { canRead } = usePermissions();
const { locale } = useI18n();
const route = useRoute();
const config = useRuntimeConfig();

const pageTitle = "Home - Kandil Internal Portal";
const pageDescription = "Welcome to Kandil Internal Portal. Manage your notes, news, announcements, and reminders in one place.";
const canonicalUrl = `${config.public.apiBase?.replace("/api", "") || ""}${route.path}`;

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
  ],
  link: [
    {
      rel: "canonical",
      href: canonicalUrl,
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
  <div class="space-y-8 md:space-y-12 w-full mb-14">
    <HomeHeroSection />

    <ClientOnly>
      <HomeDateSection />
      <template #fallback>
        <!-- optional placeholder to keep layout stable -->
        <div aria-hidden class="h-12" />
      </template>
    </ClientOnly>

    <HomeNewsAndAnnouncementsSection v-if="canRead('news')" />
    <HomeNotesSection />
  </div>
</template>
