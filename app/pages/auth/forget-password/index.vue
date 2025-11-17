<script setup lang="ts">
import ForgetPasswordForm from "~/components/auth/ForgetPasswordForm.vue"
definePageMeta({ layout: "auth" })
</script>

<template>
  <div class="w-full md:w-full lg:w-3/4 p-4 md:p-10 xl:px-16 mx-auto space-y-12">
    <!-- Logo -->
    <img src="/kandil-logo.png" alt="logo" class="w-60 mx-auto" >

    <!-- Form -->
    <ForgetPasswordForm />
  </div>
</template>
