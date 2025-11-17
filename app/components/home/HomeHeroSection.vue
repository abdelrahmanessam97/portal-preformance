<template>
  <section class="relative w-full h-64 md:h-80 overflow-hidden">
    <NuxtImg
      :src="hero.img"
      alt="Kandil Internal Portal hero background image"
      width="1920"
      height="800"
      class="absolute inset-0 h-full w-full object-cover"
      loading="eager"
      format="webp"
      quality="85"
    />
    <div class="absolute inset-0 bg-black/50" />
    <div class="absolute bottom-6 start-6 md:bottom-10 md:start-10 z-10 text-white">
      <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-[32px] font-extrabold leading-tight line-clamp-1 text-start">
        {{ t("home.hero.title") }}
      </h1>

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
