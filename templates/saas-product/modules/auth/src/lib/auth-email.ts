import "server-only";
import { createHash } from "node:crypto";
import type { AuthEmailMessage } from "@saasforge/auth/server";
import { createEmailService, localEmailProvider } from "@saasforge/email";
import { createResendEmailProvider } from "@saasforge/email/server";

let email: ReturnType<typeof createEmailService> | undefined;

function authEmailService() {
  if (email) return email;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (apiKey && from) {
    email = createEmailService(createResendEmailProvider({ apiKey, from }));
    return email;
  }
  const localTestDelivery =
    process.env.APP_ENV === "test" && process.env.AUTH_EMAIL_MODE === "local";
  if (process.env.NODE_ENV === "production" && !localTestDelivery) {
    throw new Error(
      "RESEND_API_KEY and EMAIL_FROM are required for production identity email.",
    );
  }
  email = createEmailService(localEmailProvider);
  return email;
}

const content = {
  verification: {
    subject: "Verify your email",
    action: "Verify your email address",
  },
  "password-reset": {
    subject: "Reset your password",
    action: "Reset your password",
  },
  invitation: {
    subject: "You have been invited",
    action: "Accept the workspace invitation",
  },
  "email-change": {
    subject: "Confirm your email change",
    action: "Confirm your email change",
  },
  "account-deletion": {
    subject: "Confirm account deletion",
    action: "Permanently delete your account",
  },
} as const;

export async function sendAuthEmail(message: AuthEmailMessage): Promise<void> {
  const template = content[message.kind];
  const context = message.organizationName
    ? ` for ${message.organizationName}${message.invitedByName ? `, invited by ${message.invitedByName}` : ""}`
    : "";
  const tokenDigest = createHash("sha256").update(message.token).digest("hex");

  await authEmailService().send({
    to: message.to,
    subject: template.subject,
    text: `${template.action}${context}: ${message.url}\n\nIf you did not request this, you can ignore this email.`,
    tags: { category: `auth-${message.kind}` },
    idempotencyKey: `auth-${message.kind}-${tokenDigest}`,
  });
}
