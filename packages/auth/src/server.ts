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
  schedule?: (task: () => Promise<void>) => void;
  sendAuthEmail?: (message: AuthEmailMessage) => Promise<void>;
  requireEmailVerification?: boolean;
};

export type AuthEmailMessage = {
  kind:
    | "verification"
    | "password-reset"
    | "invitation"
    | "email-change"
    | "account-deletion";
  to: string;
  url: string;
  token: string;
  userName?: string;
  organizationName?: string;
  invitedByName?: string;
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
  const emailDeliveryEnabled = Boolean(options.sendAuthEmail);
  const requireEmailVerification =
    emailDeliveryEnabled &&
    (options.requireEmailVerification ?? process.env.NODE_ENV === "production");
  const schedule = (task: () => Promise<void>) => {
    if (!options.sendAuthEmail) return;
    if (options.schedule) options.schedule(task);
    else void task();
  };
  const send = (message: AuthEmailMessage) =>
    schedule(() => options.sendAuthEmail!(message));
  const cookiePrefix =
    options.appName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) || "saas-product";

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
      requireEmailVerification,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 60 * 60,
      sendResetPassword: options.sendAuthEmail
        ? async ({ user, url, token }) => {
            send({
              kind: "password-reset",
              to: user.email,
              url,
              token,
              userName: user.name,
            });
          }
        : undefined,
    },
    emailVerification: {
      expiresIn: 60 * 60,
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: false,
      sendVerificationEmail: options.sendAuthEmail
        ? async ({ user, url, token }) => {
            send({
              kind: "verification",
              to: user.email,
              url,
              token,
              userName: user.name,
            });
          }
        : undefined,
    },
    user: {
      changeEmail: {
        enabled: true,
        sendChangeEmailConfirmation: options.sendAuthEmail
          ? async ({ user, url, token }) => {
              send({
                kind: "email-change",
                to: user.email,
                url,
                token,
                userName: user.name,
              });
            }
          : undefined,
      },
      deleteUser: {
        enabled: true,
        sendDeleteAccountVerification: options.sendAuthEmail
          ? async ({ user, url, token }) => {
              send({
                kind: "account-deletion",
                to: user.email,
                url,
                token,
                userName: user.name,
              });
            }
          : undefined,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      freshAge: 60 * 10,
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
      storage: "database",
      customRules: {
        "/sign-in/email": { window: 60, max: 10 },
        "/sign-up/email": { window: 60, max: 5 },
        "/forget-password": { window: 300, max: 5 },
        "/send-verification-email": { window: 300, max: 5 },
        "/delete-user": { window: 300, max: 3 },
      },
    },
    advanced: {
      cookiePrefix,
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
        invitationExpiresIn: 60 * 60 * 48,
        invitationLimit: 50,
        requireEmailVerificationOnInvitation: requireEmailVerification,
        sendInvitationEmail: options.sendAuthEmail
          ? async (data) => {
              const url = new URL("/accept-invitation", baseURL);
              url.searchParams.set("invitationId", data.id);
              send({
                kind: "invitation",
                to: data.email,
                url: url.toString(),
                token: data.id,
                organizationName: data.organization.name,
                invitedByName: data.inviter.user.name,
              });
            }
          : undefined,
      }),
    ],
  });
}
