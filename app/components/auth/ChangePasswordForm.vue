<!-- app/components/auth/ChangePasswordForm.vue -->
<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { AlertCircle, Eye, EyeOff } from "lucide-vue-next";
import { useForm } from "vee-validate";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import * as z from "zod";
import { Button } from "~/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel } from "~/components/ui/form";
import { Input } from "~/components/ui/input";

import { useChangePassword } from "~/composables/auth/useChangePassword";
import { useLogout } from "~/composables/auth/useLogout";

const { t } = useI18n();

type ApiResult<D> = { data: D | null; error: unknown; status: number; pending: boolean };
type ChangePasswordResponse = { status_code?: number; message?: string };

// toggles
const showOld = ref(false);
const showPassword = ref(false);
const showConfirm = ref(false);

const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

const zodSchema = z
  .object({
    oldPassword: z.string().nonempty(t("auth.changePassword.validation.oldPasswordRequired")),
    password: z.string().min(8, t("auth.changePassword.validation.passwordMin")).regex(PASSWORD_POLICY_REGEX, t("auth.changePassword.validation.passwordPolicy")),
    confirmPassword: z.string().min(8, t("auth.changePassword.validation.confirmPasswordMin")),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: t("auth.changePassword.validation.passwordsMatch"),
    path: ["confirmPassword"],
  })
  .refine((d) => d.oldPassword !== d.password, {
    message: t("auth.changePassword.validation.passwordDifferent"),
    path: ["password"],
  });

// ✅ make sure the form values are strictly strings
type FormValues = {
  oldPassword: string;
  password: string;
  confirmPassword: string;
};

const { handleSubmit, isSubmitting, meta } = useForm<FormValues>({
  validationSchema: toTypedSchema(zodSchema),
  initialValues: {
    oldPassword: "",
    password: "",
    confirmPassword: "",
  },
});

// small helper to extract error message without `any`
const extractErrorMessage = (e: unknown, fallback = t("auth.changePassword.toast.failed")) =>
  (e as { message?: string })?.message ?? (e as { error?: string })?.error ?? fallback;

// ✅ handler typed with FormValues, so args are guaranteed `string`
const onSubmit = handleSubmit(async ({ oldPassword, password, confirmPassword }: FormValues) => {
  const res = (await useChangePassword(oldPassword, password, confirmPassword)) as ApiResult<ChangePasswordResponse>;

  if (!res.error) {
    toast.success(res.data?.message ?? t("auth.changePassword.toast.success"));
    await useLogout();
    return navigateTo("/auth/login");
  }
  toast.error(extractErrorMessage(res.error));
});
</script>

<template>
  <div class="max-w-md mx-auto space-y-6">
    <h3 class="text-2xl font-bold leading-8 text-[#171717]">{{ t("auth.changePassword.title") }}</h3>
    <form class="space-y-6 sm:space-y-8" @submit="onSubmit">
      <!-- Old password -->
      <FormField v-slot="{ componentField, errorMessage }" name="oldPassword">
        <FormItem>
          <FormLabel>{{ t("auth.changePassword.oldPassword") }}</FormLabel>
          <FormControl>
            <div class="relative flex items-center">
              <Input
                v-bind="componentField"
                :type="showOld ? 'text' : 'password'"
                :placeholder="t('auth.changePassword.passwordPlaceholder')"
                class="pe-10 w-full py-5 text-base font-normal leading-6 text-[#232323] placeholder:text-[#a3a3a3] placeholder:font-normal placeholder:text-base placeholder:leading-6 border border-gray-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.06)]"
              />
              <button type="button" class="absolute end-3 text-gray-500 cursor-pointer" @click="showOld = !showOld">
                <component :is="showOld ? EyeOff : Eye" class="w-5 h-5" />
              </button>
            </div>
          </FormControl>

          <transition name="fade">
            <p v-if="errorMessage" class="mt-1 text-xs font-medium text-[#dc2626] flex items-center">
              <AlertCircle class="w-3 h-3 me-1 flex-shrink-0" />
              {{ errorMessage }}
            </p>
          </transition>
        </FormItem>
      </FormField>

      <!-- New password -->
      <FormField v-slot="{ componentField, errorMessage }" name="password">
        <FormItem>
          <FormLabel>{{ t("auth.changePassword.newPassword") }}</FormLabel>
          <FormControl>
            <div class="relative flex items-center">
              <Input
                v-bind="componentField"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="t('auth.changePassword.passwordPlaceholder')"
                class="pe-10 w-full py-5 text-base font-normal leading-6 text-[#232323] placeholder:text-[#a3a3a3] placeholder:font-normal placeholder:text-base placeholder:leading-6 border border-gray-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.06)]"
              />
              <button type="button" class="absolute end-3 text-gray-500 cursor-pointer" @click="showPassword = !showPassword">
                <component :is="showPassword ? EyeOff : Eye" class="w-5 h-5" />
              </button>
            </div>
          </FormControl>

          <transition name="fade">
            <p v-if="errorMessage" class="mt-1 text-xs font-medium text-[#dc2626] flex items-center">
              <AlertCircle class="w-3 h-3 me-1 flex-shrink-0" />
              {{ errorMessage }}
            </p>
          </transition>
        </FormItem>
      </FormField>

      <!-- Confirm password -->
      <FormField v-slot="{ componentField, errorMessage }" name="confirmPassword">
        <FormItem>
          <FormLabel>{{ t("auth.changePassword.confirmPassword") }}</FormLabel>
          <FormControl>
            <div class="relative flex items-center">
              <Input
                v-bind="componentField"
                :type="showConfirm ? 'text' : 'password'"
                :placeholder="t('auth.changePassword.passwordPlaceholder')"
                class="pe-10 w-full py-5 text-base font-normal leading-6 text-[#232323] placeholder:text-[#a3a3a3] placeholder:font-normal placeholder:text-base placeholder:leading-6 border border-gray-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.06)]"
              />
              <button type="button" class="absolute end-3 text-gray-500 cursor-pointer" @click="showConfirm = !showConfirm">
                <component :is="showConfirm ? EyeOff : Eye" class="w-5 h-5" />
              </button>
            </div>
          </FormControl>

          <transition name="fade">
            <p v-if="errorMessage" class="mt-1 text-xs font-medium text-[#dc2626] flex items-center">
              <AlertCircle class="w-3 h-3 me-1 flex-shrink-0" />
              {{ errorMessage }}
            </p>
          </transition>
        </FormItem>
      </FormField>

      <Button
        type="submit"
        class="w-full bg-[#169CC2] text-white shadow-sm hover:scale-[1.01] active:scale-100 transition-transform duration-75"
        :disabled="!meta.valid || isSubmitting"
      >
        {{ isSubmitting ? t("auth.changePassword.submitting") : t("auth.changePassword.submit") }}
      </Button>
    </form>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-2px);
}
</style>
