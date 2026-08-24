export function hasAdminAccess(role: string | null | undefined) {
  return role === "admin";
}

export function hasSupervisorAccess(role: string | null | undefined) {
  return role === "supervisor" || hasAdminAccess(role);
}
