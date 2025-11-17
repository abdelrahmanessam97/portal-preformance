<script setup lang="ts">
import ChangePasswordForm from "~/components/auth/ChangePasswordForm.vue";

const { locale } = useI18n();
const route = useRoute();
const config = useRuntimeConfig();

const pageTitle = "Change Password - Kandil Internal Portal";
const pageDescription = "Change your password for Kandil Internal Portal account.";
const siteUrl = config.public.apiBase?.replace("/api", "") || "";
const canonicalUrl = `${siteUrl}${route.path}`;
const ogImage = `${siteUrl}/kandil-logo.png`;

// Structured Data (JSON-LD) for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: pageTitle,
  description: pageDescription,
  url: canonicalUrl,
  isPartOf: {
    "@type": "WebSite",
    name: "Kandil Internal Portal",
    url: siteUrl,
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Change Password",
        item: canonicalUrl,
      },
    ],
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
      name: "robots",
      content: "noindex, nofollow",
    },
  ],
  link: [
    {
      rel: "canonical",
      href: canonicalUrl,
    },
  ],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify(structuredData),
    },
  ],
  htmlAttrs: {
    lang: locale.value || "en",
  },
});

definePageMeta({ layout: "auth" });
</script>

<template>
  <main class="w-full md:w-full lg:w-3/4 p-4 md:p-10 xl:px-16 mx-auto space-y-12">
    <!-- Logo -->
    <NuxtImg src="/kandil-logo.png" alt="Kandil Internal Portal logo" width="240" height="80" class="w-60 mx-auto" loading="eager" format="webp" quality="85" />

    <!-- Form -->
    <ChangePasswordForm />
  </main>
</template>
