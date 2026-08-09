import "server-only";

import { belongsToOrganization } from "@saasforge/auth";
import { database } from "@saasforge/database";

export async function getPrimaryMembership(userId: string) {
  return database.member.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { organization: true },
  });
}

export async function getAuthorizedMembership(input: {
  organizationId: string;
  userId: string;
}) {
  const membership = await database.member.findUnique({
    where: { organizationId_userId: input },
    include: { organization: true },
  });
  return belongsToOrganization(membership, input) ? membership : null;
}
