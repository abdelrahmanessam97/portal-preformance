// middleware/permission.ts
import { useAuthStore } from '~/stores/auth'
import { useLocalePath } from '#imports'

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  const localePath = useLocalePath()

  // Map route paths to their required read permissions
  // Using regex patterns to match routes with or without locale prefix
  // Note: categories, folders, and files pages handle their own empty states
  const routePermissionMap: Array<{ pattern: RegExp; permission: string; redirect: boolean }> = [
    { pattern: /\/categories(?:\/|$)/, permission: 'categories-read', redirect: false }, // Show empty state instead
    { pattern: /\/folders(?:\/|$)/, permission: 'folders-read', redirect: false }, // Show empty state instead
    { pattern: /\/files(?:\/|$)/, permission: 'files-read', redirect: false }, // Show empty state instead
    { pattern: /\/permissions(?:\/|$)/, permission: 'roles-read', redirect: true }, // Redirect to home
    { pattern: /\/recycle-bin(?:\/|$)/, permission: 'recycleBin-read', redirect: true }, // Redirect to home
  ]

  // Find matching permission for the current route
  // This works with locale-prefixed routes (e.g., /en/categories/173, /ar/categories/173)
  const matchedRoute = routePermissionMap.find(({ pattern }) => pattern.test(to.path))

  if (matchedRoute) {
    const permission = matchedRoute.permission
    
    // Check if user has the required permission
    if (!auth.hasPermission(permission)) {
      // Only redirect if the route requires it (permissions, recycle-bin)
      // Categories, folders, and files will show their own empty states
      if (matchedRoute.redirect) {
        return navigateTo(localePath('/'))
      }
    }
  }
})

