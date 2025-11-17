<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogScrollContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed, ref, watch } from "vue";
import { toast } from "vue-sonner";
import * as z from "zod";
import { useDataRefresh } from "~/composables/useDataRefresh";
import { useActions } from "~/composables/roles/useActions";
import { useAdminSections } from "~/composables/roles/useAdminSections";
import { useCreateRole } from "~/composables/roles/useCreateRole";
import { useFetchRoles } from "~/composables/roles/useFetchRoles";
import LoadingSpinner from "../LoadingSpinner.vue";

const { t, locale } = useI18n();

const emit = defineEmits<{
  (e: "save"): void;
}>();

const isOpen = ref(false);
const isSubmitting = ref(false);
const showValidationErrors = ref(false);

const { refetchRoles } = useFetchRoles({ immediate: false });
const { refreshRolesAndAdmins } = useDataRefresh();

const { data: sectionsData, pending: sectionsLoading, error: sectionsError } = await useAdminSections();
const { data: actionsData, pending: actionsLoading, error: actionsError } = await useActions();

interface Section {
  id: number;
  title: string;
  display_name: string;
}

interface Action {
  id: number;
  title: string;
  display_name: string;
}

const sections = computed(() => (sectionsData?.value as { data: Section[] })?.data || []);
const actions = computed(() => (actionsData?.value as { data: Action[] })?.data || []);

const createFormSchema = () => {
  const schemaFields: Record<string, z.ZodTypeAny> = {
    name: z
      .string({ required_error: t("permissions.role.validation.nameRequired") })
      .min(1, t("permissions.role.validation.nameRequired"))
      .min(3, t("permissions.role.validation.nameMinLength"))
      .max(50, t("permissions.role.validation.nameMaxLength")),
  };

  sections.value.forEach((section: Section) => {
    actions.value.forEach((action: Action) => {
      const fieldName = `${section.title}_${action.title.toLowerCase()}`;
      schemaFields[fieldName] = z.boolean().default(false);
    });
  });

  return z.object(schemaFields);
};

const { handleSubmit, resetForm, values, setFieldValue } = useForm({
  validationSchema: computed(() => toTypedSchema(createFormSchema())),
});

watch([isOpen, sections, actions], () => {
  if (isOpen.value && sections.value.length > 0 && actions.value.length > 0) {
    resetForm();
    showValidationErrors.value = false;
  }
});

const getFieldValue = (fieldName: string) => {
  return values[fieldName] || false;
};

const isAllSelected = computed(() => {
  const permissionFields = Object.keys(values).filter((key) => key !== "name");
  return permissionFields.length > 0 && permissionFields.every((field) => values[field as keyof typeof values]);
});

const toggleSelectAll = (checked: boolean) => {
  sections.value.forEach((section: Section) => {
    actions.value.forEach((action: Action) => {
      const fieldName = `${section.title}_${action.title.toLowerCase()}`;
      setFieldValue(fieldName, checked);
    });
  });
};

const getSelectedPermissions = (formValues: Record<string, unknown>) => {
  const selectedPermissions: string[] = [];

  Object.entries(formValues).forEach(([key, value]) => {
    if (key !== "name" && value === true) {
      const permission = key.replace("_", "-");
      selectedPermissions.push(permission);
    }
  });

  return selectedPermissions;
};

const onSubmit = handleSubmit(async (formValues) => {
  const selectedPermissions = getSelectedPermissions(formValues);
  showValidationErrors.value = true;

  // Check if at least one permission is selected
  if (selectedPermissions.length === 0) {
    toast.error(t("permissions.role.validation.selectPermission"));
    return;
  }

  try {
    isSubmitting.value = true;

    const roleData = {
      name: formValues.name.trim(),
      permissions: selectedPermissions,
    };

    const { data, error } = await useCreateRole(roleData);

    if (error) {
      const errorObj = error as { message?: string };

      // Handle specific error cases
      if (
        errorObj.message?.toLowerCase().includes("already exists") ||
        errorObj.message?.toLowerCase().includes("duplicate") ||
        errorObj.message?.toLowerCase().includes("unique")
      ) {
        toast.error(t("permissions.role.toast.nameExists"));
      } else {
        toast.error(errorObj.message || t("permissions.role.toast.createFailed"));
      }
      return;
    }

    if ((data as { status_code: number })?.status_code === 201 || (data as { status_code: number })?.status_code === 200) {
      toast.success(t("permissions.role.toast.createdSuccess"));
      handleCancel();
      await Promise.all([refetchRoles(), refreshRolesAndAdmins()]);
      emit("save"); // Emit save event to parent component
    } else {
      toast.error(t("permissions.role.toast.createFailed"));
    }
  } catch (error: unknown) {
    const errorMessage = error as { message?: string } | null;

    // Handle specific error cases
    if (
      errorMessage?.message?.toLowerCase().includes("already exists") ||
      errorMessage?.message?.toLowerCase().includes("duplicate") ||
      errorMessage?.message?.toLowerCase().includes("unique")
    ) {
      toast.error(t("permissions.role.toast.nameExists"));
    } else {
      toast.error(errorMessage?.message || t("permissions.role.toast.unexpectedError"));
    }
  } finally {
    isSubmitting.value = false;
  }
});

const handleCancel = () => {
  resetForm();
  showValidationErrors.value = false;
  isOpen.value = false;
};
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <slot />
    </DialogTrigger>
    <DialogScrollContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle :class="['text-lg', 'pt-5', 'font-medium', locale === 'ar' ? 'text-right' : 'text-left']" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
          {{ t("permissions.role.addTitle") }}
        </DialogTitle>
      </DialogHeader>

      <form class="space-y-3" @submit="onSubmit">
        <FormField v-slot="{ componentField, errorMessage }" name="name">
          <FormItem>
            <FormLabel
              >{{ t("permissions.role.roleName") }} <span class="text-red-500 text-xs">{{ t("permissions.required") }}</span></FormLabel
            >
            <FormControl>
              <Input :placeholder="t('permissions.role.enterRoleName')" v-bind="componentField" :class="{ 'border-red-500': errorMessage }" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              {{ t("permissions.role.permissions") }} <span class="text-red-500 text-xs">{{ t("permissions.required") }}</span>
            </div>
          </div>

          <!-- Permissions validation error -->
          <div v-if="showValidationErrors && getSelectedPermissions(values).length === 0" class="text-red-500 text-sm">
            {{ t("permissions.role.validation.selectPermission") }}
          </div>

          <div v-if="sectionsLoading || actionsLoading" class="text-center py-4">
            <LoadingSpinner />
          </div>

          <div v-else-if="sectionsError || actionsError" class="text-center py-4">
            <p class="text-red-500">{{ t("permissions.role.loadPermissionsFailed") }}</p>
          </div>

          <div v-else class="space-y-4 max-h-[400px] overflow-y-auto">
            <div v-for="section in sections" :key="section.id" class="bg-gray-50 p-4 rounded-lg space-y-3">
              <h4 class="font-medium text-gray-900 capitalize">
                {{ t(section.display_name) }}
              </h4>
              <div class="grid grid-cols-4 gap-4">
                <FormField v-for="action in actions" :key="`${section.title}_${action.title.toLowerCase()}`" :name="`${section.title}_${action.title.toLowerCase()}`">
                  <FormItem class="flex items-center gap-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        class="h-4 w-4 rounded-md cursor-pointer accent-black checked:!bg-black"
                        :checked="getFieldValue(`${section.title}_${action.title.toLowerCase()}`)"
                        @change="(e) =>
													setFieldValue(
														`${section.title}_${action.title.toLowerCase()}`,
														(e.target as HTMLInputElement)?.checked || false
													)"
                      />
                    </FormControl>
                    <FormLabel class="text-sm !mt-0 capitalize cursor-pointer">
                      {{ action.display_name }}
                    </FormLabel>
                  </FormItem>
                </FormField>
              </div>
            </div>

            <div class="flex items-center gap-2 pt-2 px-4">
              <input
                id="select-all"
                type="checkbox"
                class="h-4 w-4 rounded-md cursor-pointer accent-black checked:!bg-black"
                :checked="isAllSelected"
                @change="(e) =>
									toggleSelectAll(
										(e.target as HTMLInputElement)?.checked || false
									)"
              />
              <Label for="select-all" class="text-sm font-medium cursor-pointer">{{ t("permissions.role.selectAll") }}</Label>
            </div>
          </div>
        </div>

        <div class="flex gap-4 pt-4">
          <Button type="button" class="flex-1" variant="outline" @click="handleCancel"> {{ t("permissions.role.cancel") }} </Button>
          <Button type="submit" :disabled="isSubmitting" class="flex-1">
            <span v-if="isSubmitting">{{ t("permissions.role.saving") }}</span>
            <span v-else>{{ t("permissions.role.save") }}</span>
          </Button>
        </div>
      </form>
    </DialogScrollContent>
  </Dialog>
</template>
