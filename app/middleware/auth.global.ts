// app/middleware/auth.global.ts
import { useAuthStore } from '~/stores/auth'
import { useLocalePath } from '#imports'

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  const localePath = useLocalePath()

  // ✅ Public routes (accessible without login)
  const publicRoutes = [
    localePath('/auth/login'),
    localePath('/auth/forget-password'),
    localePath('/auth/confirm'), // reset password via email link
  ]

  // ✅ Protected routes (require login)
  const privateRoutes = [
    localePath('/auth/change-password'), // must be logged in
    // add more private routes if needed
  ]

  const homePath = localePath('/')

  // --- PUBLIC ---
  if (publicRoutes.includes(to.path)) {
    // if logged in and trying to access login → send home
    if (auth.token && to.path === localePath('/auth/login')) {
      return navigateTo(homePath)
    }
    return
  }

  // --- PRIVATE ---
  if (privateRoutes.includes(to.path)) {
    if (!auth.token) {
      return navigateTo(localePath('/auth/login'))
    }
    return
  }

  // --- DEFAULT: All other routes are private ---
  if (!auth.token) {
    return navigateTo(localePath('/auth/login'))
  }
})
