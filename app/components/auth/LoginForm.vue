<!-- app/components/auth/LoginForm.vue -->
<script setup lang="ts">
import { useLocalePath } from "#imports";
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

import { useLogin } from "~/composables/auth/useLogin";
import { useAuthStore, type User } from "~/stores/auth";

const { t } = useI18n();

// ---- Minimal local types (match your simple composables) ----
type ApiResult<D> = { data: D | null; error: unknown; status: number; pending: boolean; needsVerification?: boolean };
type LoginResponse = { status_code?: number; data?: User; message?: string };

const auth = useAuthStore();
const localePath = useLocalePath();
const showPassword = ref(false);

const zodSchema = z.object({
  email: z.string().nonempty(t("auth.login.validation.emailRequired")).email(t("auth.login.validation.emailInvalid")),
  password: z.string().nonempty(t("auth.login.validation.passwordRequired")),
});
type FormValues = z.infer<typeof zodSchema> & { remember: boolean };

const { handleSubmit, isSubmitting, meta } = useForm<FormValues>({
  validationSchema: toTypedSchema(zodSchema),
  initialValues: { email: "", password: "", remember: false },
});

// tiny helper to read backend error without `any`
const extractErrorMessage = (e: unknown): string => {
  const m = (e as { message?: string })?.message ?? (e as { error?: string })?.error;
  return m ?? t("auth.login.toast.invalidCredentials");
};

const onSubmit = handleSubmit(async (values) => {
  const res = (await useLogin(values.email, values.password, values.remember)) as ApiResult<LoginResponse>;

  if (!res.error) {
    toast.success(t("auth.login.toast.success"), {
      description: t("auth.login.toast.welcomeBack", { name: auth.user?.name || "User" }),
    });
    return navigateTo(localePath("/"), { replace: true });
  }

  // Check if user needs verification
  if (res.needsVerification) {
    toast.error(t("auth.login.toast.notVerified"), {
      description: t("auth.login.toast.verificationRequired"),
    });
    return navigateTo(localePath("/auth/confirm"), { replace: true });
  }

  toast.error(extractErrorMessage(res.error));
});
</script>

<template>
  <form class="space-y-6 sm:space-y-8" @submit="onSubmit">
    <!-- Email -->
    <FormField v-slot="{ componentField, errorMessage }" name="email">
      <FormItem>
        <FormLabel>{{ t("auth.login.email") }}</FormLabel>
        <FormControl>
          <Input
            type="email"
            :placeholder="t('auth.login.emailPlaceholder')"
            v-bind="componentField"
            :aria-invalid="!!errorMessage"
            :aria-describedby="errorMessage ? 'email-error' : undefined"
            aria-required="true"
            autocomplete="email"
            class="w-full py-5 text-base font-normal leading-6 text-[#232323] placeholder:text-[#a3a3a3] placeholder:font-normal placeholder:text-base placeholder:leading-6 border border-gray-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.06)]"
          />
        </FormControl>

        <transition name="fade">
          <p v-if="errorMessage" id="email-error" role="alert" class="mt-1 text-xs font-medium text-[#dc2626] flex items-center">
            <AlertCircle class="w-3 h-3 me-1 flex-shrink-0" aria-hidden="true" /> {{ errorMessage }}
          </p>
        </transition>
      </FormItem>
    </FormField>

    <!-- Password -->
    <FormField v-slot="{ componentField, errorMessage }" name="password">
      <FormItem>
        <FormLabel>{{ t("auth.login.password") }}</FormLabel>
        <FormControl>
          <div class="relative flex items-center">
            <Input
              v-bind="componentField"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="t('auth.login.passwordPlaceholder')"
              :aria-invalid="!!errorMessage"
              :aria-describedby="errorMessage ? 'password-error' : undefined"
              aria-required="true"
              autocomplete="current-password"
              class="pe-10 w-full py-5 text-base font-normal leading-6 text-[#232323] placeholder:text-[#a3a3a3] placeholder:font-normal placeholder:text-base placeholder:leading-6 border border-gray-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.06)]"
            />
            <button
              type="button"
              class="absolute end-3 text-gray-600 hover:text-gray-900 cursor-pointer h-11 w-11 sm:h-8 sm:w-8 flex items-center justify-center rounded-full transition-colors"
              :aria-label="showPassword ? t('auth.login.hidePassword') || 'Hide password' : t('auth.login.showPassword') || 'Show password'"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            >
              <component :is="showPassword ? EyeOff : Eye" class="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </FormControl>

        <transition name="fade">
          <p v-if="errorMessage" id="password-error" role="alert" class="mt-1 text-xs font-medium text-[#dc2626] flex items-center">
            <AlertCircle class="w-3 h-3 me-1 flex-shrink-0" aria-hidden="true" /> {{ errorMessage }}
          </p>
        </transition>
      </FormItem>
    </FormField>

    <!-- Remember + Forgot Password Row -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
      <!-- Remember me checkbox -->
      <FormField v-slot="{ componentField }" name="remember">
        <FormItem class="flex items-center space-x-2">
          <FormControl>
            <input type="checkbox" class="w-4 h-4 border-2 border-[#E5E5E5] accent-primary cursor-pointer" v-bind="componentField" />
          </FormControl>
          <FormLabel class="cursor-pointer">{{ t("auth.login.rememberMe") }}</FormLabel>
        </FormItem>
      </FormField>

      <!-- Forgot password link -->
      <NuxtLinkLocale to="/auth/forget-password" class="text-sm text-[#169CC2] hover:underline"> {{ t("auth.login.forgotPassword") }} </NuxtLinkLocale>
    </div>

    <!-- Submit -->
    <Button
      type="submit"
      class="w-full bg-[#169CC2] shadow-sm hover:scale-[1.01] active:scale-100 transition-transform duration-75 h-11 sm:h-8"
      :disabled="!meta.valid || isSubmitting"
      :aria-busy="isSubmitting"
    >
      {{ isSubmitting ? t("auth.login.signingIn") : t("auth.login.loginButton") }}
    </Button>
  </form>
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
