<!-- app/error.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-[#f9f9f9]">
    <div class="container">
      <div class="text-center px-6 max-w-4xl mx-auto">
        <!-- Logo -->
        <div class="mb-12">
          <NuxtImg src="/kandil-logo.png" :alt="t('error.altLogo')" class="h-30 mx-auto" />
        </div>

        <!-- Error Content -->
        <div class="relative">
          <!-- Large Error Background -->
          <h1 class="text-[200px] font-bold text-primary/5 font-k2d leading-none select-none">
            {{ error?.statusCode || 404 }}
          </h1>

          <!-- Content Overlay -->
          <div class="absolute inset-0 flex items-center justify-center flex-col">
            <h2 class="text-4xl md:text-5xl font-semibold text-primary font-k2d mb-4">
              {{ error?.statusMessage || t("error.pageNotFound") }}
            </h2>

            <p v-if="error?.statusCode === 404" class="text-gray-600 max-w-lg mx-auto font-inter text-lg mb-8">
              {{ t("error.description404") }}
            </p>

            <!-- Local navigation with NuxtLink -->
            <button
              class="bg-primary text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 font-inter inline-flex items-center gap-2"
              @click="goHome"
            >
              <component :is="isRtl ? ArrowRight : ArrowLeft" class="w-5 h-5" />
              {{ t("error.backToHome") }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from "#app";
import { clearError } from "#app";
import { useLocalePath } from "#i18n";
import { ArrowLeft, ArrowRight } from "lucide-vue-next";
import { useI18n } from "vue-i18n";

defineProps<{ error: NuxtError }>();
const localePath = useLocalePath();
const { t, locale } = useI18n();

const isRtl = locale.value === "ar";

const goHome = () => clearError({ redirect: localePath("/") });
</script>
