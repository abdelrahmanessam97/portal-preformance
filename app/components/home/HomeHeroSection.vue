<template>
  <section class="relative w-full h-64 md:h-80 overflow-hidden">
    <img :src="hero.img" alt="hero background" class="absolute inset-0 h-full w-full object-cover" />
    <div class="absolute inset-0 bg-black/50" />
    <div class="absolute bottom-6 start-6 md:bottom-10 md:start-10 z-10 text-white">
      <h2 class="text-2xl sm:text-3xl md:text-4xl lg:text-[32px] font-extrabold leading-tight line-clamp-1 text-start">
        {{ t("home.hero.title") }}
      </h2>

      <p class="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold leading-snug line-clamp-1 text-start">
        {{ t("home.hero.description") }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
const { t } = useI18n();
const hero = {
  id: 1,
  img: "/hero-bg.jpg",
};
</script>
