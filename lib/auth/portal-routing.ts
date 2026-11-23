export type PortalRole = "student" | "faculty" | "department_admin";

const allowedNextPaths = new Set([
  "/student", "/student/projects", "/student/bookings", "/student/bookings/new",
  "/student/catalog", "/student/assistant", "/faculty", "/requests", "/approvals",
]);

export function sanitizePortalNext(value: string | null | undefined): string | null {
  if (!value || value.includes("\\") || /[?#]/.test(value)) return null;
  return allowedNextPaths.has(value) ? value : null;
}

export function canVisitPortalPath(path: string, roles: PortalRole[]): boolean {
  if (path === "/faculty" || path.startsWith("/faculty/") || path === "/approvals") return roles.includes("faculty") || roles.includes("department_admin");
  if (path === "/student" || path.startsWith("/student/") || path === "/requests") return roles.includes("student");
  return false;
}

export function defaultPortalPath(roles: PortalRole[]): "/student" | "/faculty" | null {
  if (roles.includes("student")) return "/student";
  if (roles.includes("faculty") || roles.includes("department_admin")) return "/faculty";
  return null;
}
