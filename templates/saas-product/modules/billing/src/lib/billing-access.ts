import "server-only";

import { hasOrganizationPermission } from "@saasforge/auth";
import { getPrimaryMembership } from "./organization";
import { getSession } from "./session";

export async function getBillingActor() {
  const session = await getSession();
  if (!session) return { status: "unauthenticated" as const };
  const membership = await getPrimaryMembership(session.user.id);
  if (
    !membership ||
    !hasOrganizationPermission(membership.role, "billing:manage")
  ) {
    return { status: "forbidden" as const };
  }
  return { status: "authorized" as const, session, membership };
}
