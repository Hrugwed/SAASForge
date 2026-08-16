import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getAuthorizedMembership,
  getPrimaryMembership,
} from "@/lib/organization";
import { requireSession } from "@/lib/session";
import { resolveFactoryOperatorPolicy } from "./factory-operator-policy";

const operatorRoles = new Set(["owner", "admin"]);

export const requireFactoryOperator = cache(async () => {
  const session = await requireSession();
  const requestHeaders = await headers();
  const configuredOrganizationId =
    process.env.SAASFORGE_OPERATOR_ORGANIZATION_ID?.trim() || null;
  const policy = resolveFactoryOperatorPolicy({
    canonicalUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() || null,
    requestHost: requestHeaders.get("host"),
    configuredOrganizationId,
    localModeEnabled: process.env.SAASFORGE_LOCAL_OPERATOR_MODE === "enabled",
    networkScope: process.env.SAASFORGE_BOUND_NETWORK_SCOPE ?? null,
  });

  const membership =
    policy.mode === "organization"
      ? await getAuthorizedMembership({
          organizationId: policy.organizationId,
          userId: session.user.id,
        })
      : policy.mode === "local"
        ? await getPrimaryMembership(session.user.id)
        : null;

  if (policy.mode === "denied") {
    redirect("/factory-access?reason=configuration");
  }
  if (!membership) {
    redirect("/factory-access?reason=membership");
  }
  if (!operatorRoles.has(membership.role)) {
    redirect("/factory-access?reason=role");
  }

  return { session, membership, policy };
});
