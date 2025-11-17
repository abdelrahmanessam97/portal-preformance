<!-- app/layouts/auth.vue -->
<template>
  <main class="flex flex-col md:flex-row min-h-screen w-full">
    <!-- Left: form -->
    <section class="w-full md:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <slot />
    </section>

    <!-- Right: image (hidden on small screens) -->
    <section class="hidden md:flex md:w-1/2 relative">
      <img
        src="/auth-img.png"
        alt="login background"
        class="w-full h-full object-cover"
      >
      <span class="absolute top-0 left-0 w-full h-full bg-black/40" />
    </section>
  </main>
</template>
