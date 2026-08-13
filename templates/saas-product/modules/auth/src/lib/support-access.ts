import "server-only";

import { getSession } from "./session";

function supportUserIds(): Set<string> {
  return new Set(
    (process.env.SUPPORT_USER_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export async function requireSupportActor() {
  const session = await getSession();
  if (!session || !supportUserIds().has(session.user.id)) return null;
  return session.user;
}
