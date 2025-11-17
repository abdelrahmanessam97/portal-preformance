<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed, ref, watch } from "vue";
import { toast } from "vue-sonner";
import * as z from "zod";
import { useDataRefresh } from "~/composables/useDataRefresh";
import { useUpdateAdmin } from "~/composables/admins/useUpdateAdmin";
import { useFetchRoles } from "~/composables/roles/useFetchRoles";
import type { ApiError } from "~~/types/role";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import SelectContent from "../ui/select/SelectContent.vue";
import SelectItem from "../ui/select/SelectItem.vue";
import SelectTrigger from "../ui/select/SelectTrigger.vue";
import SelectValue from "../ui/select/SelectValue.vue";

const { t, locale } = useI18n();

const emit = defineEmits<{
  (e: "success"): void;
  (e: "error", message: string): void;
}>();

type EditingUserPayload = { id: string; name: string; email: string; role: string; deleted: boolean };

const dialogOpen = ref(false);
const editingUser = ref<EditingUserPayload | null>(null);
const originalEmail = ref("");

// Fetch roles from API
const { data: rolesData } = useFetchRoles();
const roles = computed(() => rolesData.value?.data || []);

// Get refresh function for roles and admins
const { refreshRolesAndAdmins } = useDataRefresh();

// Zod validation schema
const zodSchema = z.object({
  name: z
    .string()
    .min(1, t("permissions.user.validation.nameRequired"))
    .min(5, t("permissions.user.validation.nameLength"))
    .max(100, t("permissions.user.validation.nameLength"))
    .regex(/^[a-zA-Z\s]+$/, t("permissions.user.validation.nameLetters")),
  email: z.string().min(1, t("permissions.user.validation.emailRequired")).email(t("permissions.user.validation.emailInvalid")),
  roleId: z.number().min(1, t("permissions.user.validation.roleRequired")),
});

type FormValues = z.infer<typeof zodSchema>;

const { handleSubmit, isSubmitting, setFieldValue, resetForm } = useForm<FormValues>({
  validationSchema: toTypedSchema(zodSchema),
  initialValues: { name: "", email: "", roleId: 0 },
});

// Watch for dialog close and reset form
watch(dialogOpen, (open) => {
  if (!open && editingUser.value === null) {
    // Reset form when dialog closes without editing
    resetForm();
  }
});

const open = (user: EditingUserPayload) => {
  editingUser.value = { ...user };
  originalEmail.value = user.email;
  dialogOpen.value = true;

  // Set form values for editing
  setFieldValue("name", user.name);
  setFieldValue("email", user.email);
  // Find role ID by name for editing
  const role = roles.value.find((r: { id: number; name: string }) => r.name === user.role);
  setFieldValue("roleId", role?.id || 0);
};

const onSubmit = handleSubmit(async (values) => {
  if (!editingUser.value) return;

  try {
    const isEmailChanged = values.email !== originalEmail.value;

    const res = await useUpdateAdmin(editingUser.value.id.replace("#", ""), {
      name: values.name,
      email: values.email,
      status: editingUser.value.deleted ? "Inactive" : "Active",
      role_id: values.roleId,
      // Add flag to indicate email change for password generation
      ...(isEmailChanged && { generate_new_password: true }),
    });

    if (res.error) {
      // Handle specific error cases
      if (res.message?.includes("email") || res.message?.includes("Email")) {
        toast.error(t("permissions.user.toast.emailExists"));
        emit("error", t("permissions.user.toast.emailExists"));
      } else {
        toast.error(t("permissions.user.toast.updateFailed"), {
          description: res.message || t("permissions.user.toast.couldNotUpdate"),
        });
        emit("error", res.message || t("permissions.user.toast.updateFailed"));
      }
      return;
    }

    // Show appropriate success message
    if (isEmailChanged) {
      toast.success(t("permissions.user.toast.emailUpdated"));
    } else {
      toast.success(res.message || t("permissions.user.toast.updatedSuccess"));
    }

    await refreshRolesAndAdmins();
    emit("success");
    dialogOpen.value = false;
    resetForm();
    editingUser.value = null;
    originalEmail.value = "";
  } catch (error: unknown) {
    const apiError = error as ApiError;
    const errorMessage = apiError?.message || "An unexpected error occurred";

    // Handle specific error cases
    if (errorMessage.includes("email") || errorMessage.includes("Email")) {
      toast.error(t("permissions.user.toast.emailExists"));
      emit("error", t("permissions.user.toast.emailExists"));
    } else {
      toast.error(t("permissions.user.toast.operationFailed"), {
        description: errorMessage,
      });
      emit("error", errorMessage);
    }
  }
});

defineExpose({ open });
</script>

<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle class="text-[#171717] px-5 font-semibold">
          <span
            class="hidden md:block"
            :class="locale === 'ar' ? 'text-right block w-full' : 'text-left block w-full'"
            :dir="locale === 'ar' ? 'rtl' : 'ltr'"
          >
            {{ t("permissions.user.editTitle") }}
          </span>
        </DialogTitle>
        <DialogDescription class="bg-gray-200 h-[0.5px] w-full mt-3" />
      </DialogHeader>

      <form class="flex flex-col gap-4 px-5" @submit="onSubmit">
        <div class="flex gap-3">
          <div class="flex-1">
            <FormField v-slot="{ componentField }" name="name">
              <FormItem>
                <FormLabel class="text-sm mb-2">{{ t("permissions.user.fullName") }} <span class="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input v-bind="componentField" type="text" :placeholder="t('permissions.user.userNamePlaceholder')" class="w-full" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>
          <div class="flex-1">
            <FormField v-slot="{ componentField }" name="email">
              <FormItem>
                <FormLabel class="text-sm mb-2">{{ t("permissions.user.email") }} <span class="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input v-bind="componentField" type="email" :placeholder="t('permissions.user.userEmailPlaceholder')" class="w-full" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>
        </div>

        <div class="flex-1">
          <FormField v-slot="{ componentField }" name="roleId">
            <FormItem>
              <FormLabel class="text-sm mb-2">{{ t("permissions.user.role") }} <span class="text-red-500">*</span></FormLabel>
              <Select :dir="locale === 'ar' ? 'rtl' : 'ltr'" v-bind="componentField">
                <FormControl>
                  <SelectTrigger class="w-full rounded-md">
                    <SelectValue :placeholder="t('permissions.user.selectRole')" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem v-for="role in roles" :key="role.id" :value="role.id">
                    {{ role.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>

        <div class="flex gap-4 px-4 pb-4 mt-4">
          <Button
            type="button"
            variant="outline"
            class="flex-1 cursor-pointer"
            :disabled="isSubmitting"
            @click="
              resetForm();
              editingUser = null;
              originalEmail = '';
              dialogOpen = false;
            "
          >
            {{ t("permissions.user.cancel") }}
          </Button>
          <Button type="submit" class="flex-1 cursor-pointer" :disabled="isSubmitting">
            <span v-if="isSubmitting">{{ t("permissions.user.updating") }}</span>
            <span v-else>{{ t("permissions.user.update") }}</span>
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>
