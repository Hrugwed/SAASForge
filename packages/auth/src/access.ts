export const organizationRoles = ["owner", "admin", "member"] as const;

export type OrganizationRole = (typeof organizationRoles)[number];

export type OrganizationPermission =
  | "organization:read"
  | "organization:update"
  | "member:invite"
  | "member:remove"
  | "billing:manage";

const rolePermissions: Record<
  OrganizationRole,
  ReadonlySet<OrganizationPermission>
> = {
  owner: new Set([
    "organization:read",
    "organization:update",
    "member:invite",
    "member:remove",
    "billing:manage",
  ]),
  admin: new Set([
    "organization:read",
    "organization:update",
    "member:invite",
    "member:remove",
  ]),
  member: new Set(["organization:read"]),
};

export function isOrganizationRole(role: string): role is OrganizationRole {
  return organizationRoles.includes(role as OrganizationRole);
}

export function hasOrganizationPermission(
  role: string,
  permission: OrganizationPermission,
): boolean {
  return isOrganizationRole(role) && rolePermissions[role].has(permission);
}

export function belongsToOrganization(
  membership: { organizationId: string; userId: string } | null,
  request: { organizationId: string; userId: string },
): boolean {
  return (
    membership?.organizationId === request.organizationId &&
    membership.userId === request.userId
  );
}
