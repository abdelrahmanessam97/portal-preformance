<!-- /app/components/global/AvatarDropDown.vue -->
<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp, Lock, LogOut } from "lucide-vue-next";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { toast } from "vue-sonner";
import { useLogout } from "~/composables/auth/useLogout";
import { useAuthStore } from "~/stores/auth";

const { locale, t } = useI18n();
const router = useRouter();
const auth = useAuthStore();

const hydrated = ref(false);
onMounted(() => {
  hydrated.value = true;
});

const user = computed(() => auth.user);

const imgSrc = computed(() => (!hydrated.value ? "/avatar-profile.png" : user.value?.avatar || "/avatar-profile.png"));

const initials = computed(() => {
  if (!hydrated.value || !user.value?.name) return " ";
  return user.value.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
});

const displayName = computed(() => (hydrated.value ? user.value?.name ?? "" : ""));

const goChangePassword = () => {
  router.push(`/${locale.value}/auth/change-password`);
  open.value = false;
};

const signOut = async () => {
  const res = await useLogout();
  if (!res.error && res.data) {
    toast.success(res.data.message || t("avatar.logoutSuccess"));
  }
  router.push(`/${locale.value}/auth/login`);
  open.value = false;
};

const open = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    open.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <!-- Trigger Button -->
    <button class="flex items-center gap-1 cursor-pointer select-none focus:outline-none" aria-expanded="false" aria-haspopup="true" @click="open = !open">
      <!-- Avatar -->
      <Avatar class="relative flex size-9 md:size-10 shrink-0 overflow-hidden rounded-full">
        <AvatarImage :src="imgSrc" alt="avatar profile" />
        <AvatarFallback aria-label="User avatar initials">
          {{ initials }}
        </AvatarFallback>
      </Avatar>

      <!-- Chevron -->
      <ChevronDown class="w-4 h-4 text-gray-500 transition-transform duration-200" :class="{ 'rotate-180': open }" aria-hidden="true" />
    </button>

    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div v-if="open" class="absolute end-0 top-full mt-2 w-56 bg-white rounded-md border border-gray-200 shadow-lg z-50 py-2" role="menu" aria-orientation="vertical">
        <!-- User name -->
        <div class="flex items-center justify-between font-semibold cursor-pointer px-3 py-2 hover:bg-gray-50 text-sm" @click="open = false">
          <span>{{ displayName }}</span>
          <ChevronUp class="w-4 h-4 text-gray-500" />
        </div>

        <!-- Change password -->
        <button
          class="w-full text-start cursor-pointer flex items-center gap-2 rounded-md transition-colors duration-200 hover:bg-gray-100 focus:bg-gray-100 px-3 py-2 text-sm"
          @click="goChangePassword"
        >
          <Lock class="w-4 h-4 text-gray-600" aria-hidden="true" />
          <span>{{ t("avatar.changePassword") }}</span>
        </button>

        <!-- Logout -->
        <button
          class="w-full text-start cursor-pointer flex items-center gap-2 rounded-md transition-colors duration-200 text-red-600 hover:bg-red-50 focus:bg-red-50 px-3 py-2 text-sm"
          @click="signOut"
        >
          <LogOut class="w-4 h-4 text-red-600" aria-hidden="true" />
          <span>{{ t("avatar.signOut") }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>
