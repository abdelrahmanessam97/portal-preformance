<!-- app/pages/index.vue -->
<script setup lang="ts">
import HomeDateSection from "~/components/home/HomeDateSection.vue";
import HomeHeroSection from "~/components/home/HomeHeroSection.vue";
import HomeNewsAndAnnouncementsSection from "~/components/home/HomeNewsAndAnnouncementsSection.vue";
import HomeNotesSection from "~/components/home/HomeNotesSection.vue";
import { usePermissions } from "~/composables/usePermissions";

const { canRead } = usePermissions();

definePageMeta({
  title: "Home Page - Kandil Internal Portal",
  meta: [
    {
      name: "description",
      content: "Welcome to the home page of My Application.",
    },
    { name: "keywords", content: "home, my application, notes, news" },
  ],
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
