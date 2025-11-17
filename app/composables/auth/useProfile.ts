// composables/auth/useProfile.ts
import { useApi } from '~/composables/useApi';
import { useAuthStore } from '~/stores/auth';
 
interface ProfileResponse {
  status_code: number;
  message: string;
  data: {
    id: number;
    name: string;
    email: string;
    role_id: number;
    role_name: string;
    permissions: Array<{
      id: number;
      title: string;
    }>;
    status: string;
    access_token: string;
  };
}
 
export const useProfile = () => {
  const api = useApi();
  const authStore = useAuthStore();
 
  const fetchProfile = async () => {
    authStore.setLoading(true);
   
    try {
      const response = await api<ProfileResponse>('/admin/profile', {
        method: 'GET'
      });
 
      if (response.status_code === 200 && response.data) {
        // Update auth store with fresh user data
        authStore.updateUserData(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch profile');
      }
    } catch (error: any) {
 
     
      // If token is invalid, clear auth
      if (error.status === 401 || error.status === 403) {
        authStore.clearAuth();
        await navigateTo('/login');
      }
     
      throw error;
    } finally {
      authStore.setLoading(false);
    }
  };
 
  const refreshProfile = async () => {
    try {
      return await fetchProfile();
    } catch (error) {
 
      return null;
    }
  };
 
  // Auto-fetch profile if user is authenticated but no user data exists
  const initProfile = async () => {
    if (authStore.isAuthenticated && !authStore.currentUser) {
      await fetchProfile();
    }
  };
 
  // Composable to ensure profile is loaded
  const ensureProfile = async () => {
    if (authStore.isAuthenticated && !authStore.currentUser) {
      await fetchProfile();
    }
    return authStore.currentUser;
  };
 
  return {
    fetchProfile,
    refreshProfile,
    initProfile,
    ensureProfile,
    isLoading: computed(() => authStore.isLoading),
    currentUser: computed(() => authStore.currentUser),
    isProfileLoaded: computed(() => !!authStore.currentUser),
  };
};