// composables/useAccessCheck.ts
import { useAuthStore } from "~/stores/auth";

interface AccessItem {
  roles_has_access?: Array<{ id: number }>;
  admins_has_access?: Array<{ id: number }>;
}

/**
 * Check if the current user has access to an item (file, folder, category, attachment)
 * 
 * Rules:
 * - If item has no access restrictions (empty or undefined arrays), it's accessible to everyone
 * - If item has roles_has_access, user's role_id must be in the list
 * - If item has admins_has_access, user's id must be in the list
 * - If both are present, user needs access via either roles OR admins
 */
export const useAccessCheck = () => {
  const auth = useAuthStore();
  const user = auth.me;

  const hasAccess = (item: AccessItem | null | undefined): boolean => {
    // If no item, no access
    if (!item) return false;

    // If no user, no access
    if (!user) return false;

    const rolesAccess = item.roles_has_access;
    const adminsAccess = item.admins_has_access;

    // If no access restrictions, item is accessible to everyone
    const hasRolesRestriction = rolesAccess && rolesAccess.length > 0;
    const hasAdminsRestriction = adminsAccess && adminsAccess.length > 0;

    if (!hasRolesRestriction && !hasAdminsRestriction) {
      return true; // No restrictions = accessible to everyone
    }

    // Check role access
    if (hasRolesRestriction) {
      const userRoleId = user.role_id;
      const hasRoleAccess = rolesAccess.some((role) => role.id === userRoleId);
      if (hasRoleAccess) return true;
    }

    // Check admin access
    if (hasAdminsRestriction) {
      const userId = user.id;
      const hasAdminAccess = adminsAccess.some((admin) => admin.id === userId);
      if (hasAdminAccess) return true;
    }

    // No access found
    return false;
  };

  return {
    hasAccess,
  };
};

