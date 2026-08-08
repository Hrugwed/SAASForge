import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@saasforge/database";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

export type SaaSAuthOptions = {
  appName: string;
  database: PrismaClient;
  baseURL?: string;
  secret?: string;
};

function requireAuthConfiguration(options: SaaSAuthOptions) {
  const baseURL = options.baseURL ?? process.env.BETTER_AUTH_URL;
  const secret = options.secret ?? process.env.BETTER_AUTH_SECRET;

  if (!baseURL) {
    throw new Error("BETTER_AUTH_URL is required.");
  }

  if (!secret || secret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters.");
  }

  return { baseURL, secret };
}

function workspaceSlug(name: string, userId: string): string {
  const normalized = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  return `${normalized || "workspace"}-${userId.slice(0, 8)}`;
}

function trustedOrigins(baseURL: string): string[] {
  const origins = new Set([baseURL]);
  const configuredAppURL = process.env.NEXT_PUBLIC_APP_URL;

  if (configuredAppURL) {
    origins.add(configuredAppURL);
  }

  const url = new URL(baseURL);
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    const loopbackAlias = new URL(baseURL);
    loopbackAlias.hostname =
      url.hostname === "localhost" ? "127.0.0.1" : "localhost";
    origins.add(loopbackAlias.origin);
  }

  return [...origins];
}

export function createSaaSAuth(options: SaaSAuthOptions) {
  const { baseURL, secret } = requireAuthConfiguration(options);

  return betterAuth({
    appName: options.appName,
    baseURL,
    secret,
    database: prismaAdapter(options.database, { provider: "postgresql" }),
    trustedOrigins: trustedOrigins(baseURL),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      requireEmailVerification: false,
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
      storage: "database",
      customRules: {
        "/sign-in/email": { window: 60, max: 10 },
        "/sign-up/email": { window: 60, max: 5 },
      },
    },
    advanced: {
      cookiePrefix: "saasforge",
      useSecureCookies: baseURL.startsWith("https://"),
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            const createdAt = new Date();

            await options.database.organization.create({
              data: {
                id: randomUUID(),
                name: `${user.name}'s workspace`,
                slug: workspaceSlug(user.name, user.id),
                createdAt,
                members: {
                  create: {
                    id: randomUUID(),
                    userId: user.id,
                    role: "owner",
                    createdAt,
                  },
                },
              },
            });
          },
        },
      },
    },
    plugins: [
      organization({
        allowUserToCreateOrganization: true,
        creatorRole: "owner",
        membershipLimit: 100,
      }),
    ],
  });
}
