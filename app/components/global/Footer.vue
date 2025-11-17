<!-- app/components/global/Footer.vue -->
<script setup lang="ts">
import { Dribbble, Facebook, Github, Twitter } from "lucide-vue-next";

const { t } = useI18n();
</script>

<template>
  <footer class="w-full border-t border-gray-200 bg-white py-4 px-6 flex flex-col md:flex-row items-center justify-between z-40" role="contentinfo">
    <div class="text-sm text-gray-700 text-center mt-2 md:mt-0">
      {{ t("footer.copyright", { year: new Date().getFullYear() }) }}
    </div>

    <nav class="flex items-center gap-4 mt-2 md:mt-0" aria-label="Social media links">
      <a
        href="https://github.com"
        target="_blank"
        rel="noopener noreferrer"
        class="text-gray-600 hover:text-gray-900 transition-colors h-11 w-11 sm:h-8 sm:w-8 flex items-center justify-center rounded-full"
        :aria-label="t('footer.github') || 'Visit us on GitHub'"
      >
        <Github class="w-5 h-5" aria-hidden="true" />
      </a>
      <a
        href="https://twitter.com"
        target="_blank"
        rel="noopener noreferrer"
        class="text-gray-600 hover:text-gray-900 transition-colors h-11 w-11 sm:h-8 sm:w-8 flex items-center justify-center rounded-full"
        :aria-label="t('footer.twitter') || 'Visit us on Twitter'"
      >
        <Twitter class="w-5 h-5" aria-hidden="true" />
      </a>
      <a
        href="https://dribbble.com"
        target="_blank"
        rel="noopener noreferrer"
        class="text-gray-600 hover:text-gray-900 transition-colors h-11 w-11 sm:h-8 sm:w-8 flex items-center justify-center rounded-full"
        :aria-label="t('footer.dribbble') || 'Visit us on Dribbble'"
      >
        <Dribbble class="w-5 h-5" aria-hidden="true" />
      </a>
      <a
        href="https://facebook.com"
        target="_blank"
        rel="noopener noreferrer"
        class="text-gray-600 hover:text-gray-900 transition-colors h-11 w-11 sm:h-8 sm:w-8 flex items-center justify-center rounded-full"
        :aria-label="t('footer.facebook') || 'Visit us on Facebook'"
      >
        <Facebook class="w-5 h-5" aria-hidden="true" />
      </a>
    </nav>
  </footer>
</template>
