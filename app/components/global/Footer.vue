<!-- app/components/global/Footer.vue -->
<script setup lang="ts">
import { Dribbble, Facebook, Github, Twitter } from "lucide-vue-next";

const { t } = useI18n();
</script>

<template>
  <footer class="w-full border-t border-gray-200 bg-white py-4 px-6 flex flex-col md:flex-row items-center justify-between z-40">

    <div class="text-sm text-gray-500 text-center mt-2 md:mt-0">
      {{ t("footer.copyright", { year: new Date().getFullYear() }) }}
    </div>

    <div class="flex items-center gap-4 mt-2 md:mt-0">
      <a href="https://github.com" target="_blank" class="text-gray-400 hover:text-gray-600">
        <Github class="w-5 h-5" />
      </a>
      <a href="https://twitter.com" target="_blank" class="text-gray-400 hover:text-gray-600">
        <Twitter class="w-5 h-5" />
      </a>
      <a href="https://dribbble.com" target="_blank" class="text-gray-400 hover:text-gray-600">
        <Dribbble class="w-5 h-5" />
      </a>
      <a href="https://facebook.com" target="_blank" class="text-gray-400 hover:text-gray-600">
        <Facebook class="w-5 h-5" />
      </a>
    </div>
  </footer>
</template>
