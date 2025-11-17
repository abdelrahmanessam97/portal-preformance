<!-- app/components/auth/ConfirmPasswordForm.vue -->
<script setup lang="ts">
import { useCookie, useLocalePath } from "#imports";
import { useVerifyPassword } from "@/composables/auth/useVerifyPassword";
import { toTypedSchema } from "@vee-validate/zod";
import { AlertCircle, Eye, EyeOff } from "lucide-vue-next";
import { useForm } from "vee-validate";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import * as z from "zod";
import { Button } from "~/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { useResendPassoword } from "~/composables/auth/useResendPassword";

const { t } = useI18n();

type ApiResult<D> = {
  data: D | null;
  error: unknown;
  status: number;
  pending: boolean;
};
type VerifyResponse = { status_code?: number; message?: string };

const localePath = useLocalePath();
const resetEmail = useCookie<string | null>("reset_email");

// toggles
const showPassword = ref(false);
const showConfirm = ref(false);

const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

// schema
const zodSchema = z
  .object({
    password: z.string().min(8, t("auth.confirmPassword.validation.passwordMin")).regex(PASSWORD_POLICY_REGEX, t("auth.confirmPassword.validation.passwordPolicy")),
    confirmPassword: z.string().min(8, t("auth.confirmPassword.validation.confirmPasswordMin")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t("auth.confirmPassword.validation.passwordsMatch"),
    path: ["confirmPassword"],
  });

type FormValues = { password: string; confirmPassword: string };

const { handleSubmit, meta, isSubmitting } = useForm<FormValues>({
  validationSchema: toTypedSchema(zodSchema),
  initialValues: { password: "", confirmPassword: "" },
});

const extractErrorMessage = (e: unknown, fallback = t("auth.confirmPassword.toast.failed")) =>
  (e as { message?: string })?.message ?? (e as { error?: string })?.error ?? fallback;

// ===== resend logic =====
const countdown = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;
const resendDisabled = ref(false);

const formattedTime = computed(() => `00:${String(countdown.value).padStart(2, "0")}`);

const startCountdown = (sec = 60) => {
  countdown.value = sec;
  resendDisabled.value = true;
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(timer!);
      timer = null;
      resendDisabled.value = false;
    }
  }, 1000);
};

const doResend = async () => {
  if (resendDisabled.value) return;
  resendDisabled.value = true;

  const email = resetEmail.value;
  if (!email) {
    toast.error(t("auth.confirmPassword.toast.emailMissing"));
    resendDisabled.value = false;
    return;
  }

  const res = (await useResendPassoword(email)) as ApiResult<VerifyResponse>;
  if (!res.error) {
    toast.success(res.data?.message ?? t("auth.confirmPassword.toast.resendSuccess"));
    startCountdown(60);
  } else {
    toast.error(extractErrorMessage(res.error, t("auth.confirmPassword.toast.resendFailed")));
    resendDisabled.value = false;
  }
};

onMounted(() => {
  if (!resetEmail.value) {
    toast.error(t("auth.confirmPassword.toast.emailNotFound"));
  }
  startCountdown(60);
});

// ===== submit form =====
const onSubmit = handleSubmit(async ({ password, confirmPassword }) => {
  const email = resetEmail.value;
  if (!email) {
    toast.error(t("auth.confirmPassword.toast.emailMissing"));
    return;
  }

  const res = (await useVerifyPassword(email, password, confirmPassword)) as ApiResult<VerifyResponse>;

  if (!res.error) {
    toast.success(res.data?.message ?? t("auth.confirmPassword.toast.success"));
    useCookie<string | null>("reset_email").value = null;
    return navigateTo(localePath("/auth/login"));
  }
  toast.error(extractErrorMessage(res.error));
});
</script>

<template>
  <div class="max-w-md mx-auto space-y-6">
    <h3 class="text-2xl font-bold leading-8 text-[#171717]">{{ t("auth.confirmPassword.title") }}</h3>

    <p v-if="resetEmail" class="text-xs text-[#706F6F]">
      {{ t("auth.confirmPassword.resettingFor", { email: resetEmail }) }}
    </p>

    <form class="space-y-6 sm:space-y-8" @submit="onSubmit">
      <!-- New password -->
      <FormField v-slot="{ componentField, errorMessage }" name="password">
        <FormItem>
          <FormLabel>{{ t("auth.confirmPassword.newPassword") }}</FormLabel>
          <FormControl>
            <div class="relative flex items-center">
              <Input
                v-bind="componentField"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="t('auth.confirmPassword.passwordPlaceholder')"
                class="pe-10 w-full py-5 text-base font-normal leading-6 text-[#232323] placeholder:text-[#a3a3a3] border border-gray-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.06)]"
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
          <FormLabel>{{ t("auth.confirmPassword.confirmPassword") }}</FormLabel>
          <FormControl>
            <div class="relative flex items-center">
              <Input
                v-bind="componentField"
                :type="showConfirm ? 'text' : 'password'"
                :placeholder="t('auth.confirmPassword.passwordPlaceholder')"
                class="pe-10 w-full py-5 text-base font-normal leading-6 text-[#232323] placeholder:text-[#a3a3a3] border border-gray-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.06)]"
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

      <!-- Submit -->
      <Button
        type="submit"
        class="w-full bg-[#169CC2] shadow-sm hover:scale-[1.01] active:scale-100 transition-transform duration-75"
        :disabled="!meta.valid || isSubmitting"
      >
        {{ isSubmitting ? t("auth.confirmPassword.submitting") : t("auth.confirmPassword.submit") }}
      </Button>

      <!-- Resend Section -->
      <div class="text-sm text-center text-[#706F6F]">
        <div v-if="countdown > 0" class="flex justify-center items-center gap-1">
          {{ t("auth.confirmPassword.resendAvailable") }}
          <span class="font-semibold text-[#DC2626]">{{ formattedTime }}</span>
        </div>
        <div v-else class="flex justify-center items-center gap-1">
          {{ t("auth.confirmPassword.didntGetMail") }}
          <button
            type="button"
            class="text-[#169CC2] underline cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="resendDisabled"
            @click="doResend"
          >
            {{ t("auth.confirmPassword.resend") }}
          </button>
        </div>
      </div>
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
