export const USER_ROLES = {
  ADMIN: "admin",
  EDITOR: "editor",
  VIEWER: "viewer"
};

const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: ["view_dashboard", "create_session", "edit_content", "access_admin"],
  [USER_ROLES.EDITOR]: ["view_dashboard", "create_session", "edit_content"],
  [USER_ROLES.VIEWER]: ["view_dashboard"]
};

export function normalizeRole(role) {
  if (!role) {
    return USER_ROLES.VIEWER;
  }

  const lowered = String(role).toLowerCase();
  if (lowered === "owner") {
    return USER_ROLES.ADMIN;
  }
  return ROLE_PERMISSIONS[lowered] ? lowered : USER_ROLES.VIEWER;
}

export function hasPermission(role, permission) {
  const normalizedRole = normalizeRole(role);
  return ROLE_PERMISSIONS[normalizedRole].includes(permission);
}
