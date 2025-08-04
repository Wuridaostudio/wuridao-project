// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuth();

  if (
    !isAuthenticated.value &&
    to.path.startsWith("/admin") &&
    to.path !== "/admin/login"
  ) {
    return navigateTo("/admin/login");
  }

  if (isAuthenticated.value && to.path === "/admin/login") {
    return navigateTo("/admin");
  }
});
