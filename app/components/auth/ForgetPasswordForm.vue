<script setup lang="ts">
import { useLocalePath } from "#imports";
import { toTypedSchema } from "@vee-validate/zod";
import { AlertCircle } from "lucide-vue-next";
import { useForm } from "vee-validate";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import * as z from "zod";
import { Button } from "~/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { useForgotPassword } from "~/composables/auth/useForgotPassword";

const { t } = useI18n();

type ApiResult<D> = {
  data: D | null;
  error: unknown;
  status: number;
  pending: boolean;
};
type CommonResponse = { status_code: number; message: string; data: unknown[] };

const localePath = useLocalePath();

const zodSchema = z.object({
  email: z.string().nonempty(t("auth.forgotPassword.validation.emailRequired")).email(t("auth.forgotPassword.validation.emailInvalid")),
});

const { handleSubmit, values, errors, isSubmitting } = useForm<{ email: string }>({
  validationSchema: toTypedSchema(zodSchema),
  initialValues: { email: "" },
});

const successMessage = ref("");

const extractErrorMessage = (e: unknown, fallback: string) => {
  // Handle API error response with status_code and message
  if (e && typeof e === "object" && "status_code" in e && "message" in e) {
    const apiError = e as { status_code: number; message: string };
    return apiError.message; // Return the actual message from API
  }

  // Handle $fetch error with data property
  if (e && typeof e === "object" && "data" in e) {
    const errorWithData = e as { data?: { status_code?: number; message?: string } };
    if (errorWithData.data?.message) {
      return errorWithData.data.message; // Return the actual message from API
    }
  }

  // Handle $fetch error with response._data
  if (e && typeof e === "object" && "response" in e) {
    const errorWithResponse = e as { response?: { _data?: { status_code?: number; message?: string } } };
    if (errorWithResponse.response?._data?.message) {
      return errorWithResponse.response._data.message; // Return the actual message from API
    }
  }

  // Handle string errors (like the HTTP status message)
  if (typeof e === "string") {
    return e; // Return the string as-is
  }

  // Handle other error formats
  return (e as { message?: string })?.message ?? (e as { error?: string })?.error ?? fallback;
};

const doForgot = async () => {
  const email = values.email as string;
  const res = (await useForgotPassword(email)) as ApiResult<CommonResponse>;

  if (!res.error && res.data) {
    toast.success(t("auth.forgotPassword.toast.success"));
    successMessage.value = t("auth.forgotPassword.toast.messageSent");

    // wait 3 seconds, then go to confirm page
    setTimeout(() => {
      navigateTo(localePath("/auth/confirm"));
    }, 3000);
  } else {
    toast.error(extractErrorMessage(res.error, t("auth.forgotPassword.toast.failed")));
  }
};

const onSubmit = handleSubmit(async () => {
  await doForgot();
});

const isValid = computed(() => !!values.email && !errors.value.email && !isSubmitting.value);
</script>

<template>
  <div class="space-y-6 w-full max-w-md mx-auto">
    <div class="flex flex-col gap-2 items-start">
      <h1 class="text-2xl font-bold">{{ t("auth.forgotPassword.title") }}</h1>
      <p class="flex gap-2 text-sm text-[#706F6F]">
        <span>{{ t("auth.forgotPassword.rememberPassword") }}</span>
        <NuxtLinkLocale to="/auth/login" class="text-[#169CC2] underline"> {{ t("auth.forgotPassword.signIn") }} </NuxtLinkLocale>
      </p>
    </div>

    <form class="space-y-6 sm:space-y-8" @submit.prevent="onSubmit">
      <FormField v-slot="{ componentField, errorMessage }" name="email">
        <FormItem>
          <FormLabel>{{ t("auth.forgotPassword.email") }}</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              type="email"
              :placeholder="t('auth.forgotPassword.emailPlaceholder')"
              :aria-invalid="!!errorMessage"
              :aria-describedby="errorMessage ? 'email-error' : successMessage ? 'success-message' : undefined"
              aria-required="true"
              autocomplete="email"
              class="w-full py-5 text-base font-normal leading-6 text-[#232323] placeholder:text-[#a3a3a3] border border-gray-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.06)]"
            />
          </FormControl>

          <transition name="fade">
            <p v-if="errorMessage" id="email-error" role="alert" class="mt-1 text-xs font-medium text-[#dc2626] flex items-center">
              <AlertCircle class="w-3 h-3 me-1 flex-shrink-0" aria-hidden="true" />
              {{ errorMessage }}
            </p>
          </transition>
        </FormItem>
      </FormField>

      <Button
        type="submit"
        :disabled="!isValid"
        class="w-full bg-[#169CC2] shadow-sm hover:scale-[1.01] active:scale-100 transition-transform duration-75 h-11 sm:h-8"
        :aria-busy="isSubmitting"
      >
        {{ isSubmitting ? t("auth.forgotPassword.sending") : t("auth.forgotPassword.send") }}
      </Button>

      <transition name="fade">
        <p v-if="successMessage" id="success-message" role="status" aria-live="polite" class="text-green-600 text-sm text-center">
          {{ successMessage }}
        </p>
      </transition>
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
