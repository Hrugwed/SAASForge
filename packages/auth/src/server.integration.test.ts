import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@saasforge/database";
import { createSaaSAuth } from "./server";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for auth integration tests.");
}
const integration = describe;
const email = `auth-integration-${Date.now()}@example.com`;
let database: PrismaClient;

beforeAll(async () => {
  if (!process.env.DATABASE_URL) return;
  ({ database } = await import("@saasforge/database"));
});

afterAll(async () => {
  if (!database) return;
  const user = await database.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (user) {
    const memberships = await database.member.findMany({
      where: { userId: user.id },
      select: { organizationId: true },
    });
    await database.organization.deleteMany({
      where: {
        id: { in: memberships.map(({ organizationId }) => organizationId) },
      },
    });
    await database.user.delete({ where: { id: user.id } });
  }
  await database.$disconnect();
});

integration("Better Auth database lifecycle", () => {
  it("persists signup, provisions an owner workspace, and revokes signout", async () => {
    const baseURL = "http://127.0.0.1:4310";
    const auth = createSaaSAuth({
      appName: "SaaSForge Integration",
      baseURL,
      database,
      requireEmailVerification: false,
      secret: "integration-only-auth-secret-that-is-long-enough",
    });
    const requestHeaders = new Headers({
      origin: baseURL,
      "x-forwarded-for": `127.0.0.${Math.floor(Math.random() * 200) + 20}`,
    });
    const signup = await auth.api.signUpEmail({
      body: {
        email,
        name: "Integration Owner",
        password: "Integration-password-2026",
      },
      headers: requestHeaders,
      returnHeaders: true,
    });
    const setCookie = signup.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    const cookie = setCookie!.split(";", 1)[0]!;
    const sessionHeaders = new Headers({ cookie, origin: baseURL });

    await expect(
      auth.api.getSession({ headers: sessionHeaders }),
    ).resolves.toMatchObject({ user: { email } });
    await expect(
      database.user.findUnique({
        where: { email },
        select: {
          members: {
            select: {
              role: true,
              organization: { select: { name: true } },
            },
          },
        },
      }),
    ).resolves.toEqual({
      members: [
        {
          role: "owner",
          organization: { name: "Integration Owner's workspace" },
        },
      ],
    });

    await expect(
      auth.api.signOut({ headers: sessionHeaders }),
    ).resolves.toEqual({ success: true });
    await expect(
      database.session.count({ where: { userId: signup.response.user.id } }),
    ).resolves.toBe(0);
    await expect(
      auth.api.getSession({ headers: sessionHeaders }),
    ).resolves.toBeNull();
  });
});
