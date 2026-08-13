import "server-only";

import { getPrimaryMembership } from "./organization";
import { getSession } from "./session";

export async function getStorageActor() {
  const session = await getSession();
  if (!session) return { status: "unauthenticated" as const };
  const membership = await getPrimaryMembership(session.user.id);
  if (!membership) return { status: "forbidden" as const };
  return { status: "authorized" as const, session, membership };
}
