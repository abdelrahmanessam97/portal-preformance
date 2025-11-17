<template>
  <div
    v-if="show"
    class="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 backdrop-blur-sm"
    role="status"
    aria-busy="true"
    aria-live="polite"
    aria-label="Page loading"
  >
    <span class="sr-only">Loading page...</span>
    <span class="loader" aria-hidden="true"></span>
  </div>
</template>

<script setup lang="ts">
defineProps({ show: { type: Boolean, required: true } });
</script>

<style scoped>
.loader {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  position: relative;
  display: inline-block;
  background: conic-gradient(from 0deg, #007795 30%, rgba(0, 119, 149, 0.2) 100%);
  animation: rotation 1.2s linear infinite;
  filter: drop-shadow(0 0 10px rgba(0, 119, 149, 0.6));
}

.loader::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 78px;
  height: 78px;
  border-radius: 50%;
  background: #ffffff;
  filter: blur(0.5px);
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
