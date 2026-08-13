import "server-only";
import {
  createEmailService,
  localEmailProvider,
  renderWelcomeEmail,
} from "@saasforge/email";
import { createResendEmailProvider } from "@saasforge/email/server";
import { productConfig } from "./product-config";

let service: ReturnType<typeof createEmailService> | undefined;

export function getEmailService() {
  if (service) return service;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (apiKey && from) {
    service = createEmailService(createResendEmailProvider({ apiKey, from }));
    return service;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "RESEND_API_KEY and EMAIL_FROM are required when the email module is enabled.",
    );
  }
  service = createEmailService(localEmailProvider);
  return service;
}

export function productWelcomeEmail(input: {
  userName: string;
  dashboardUrl: string;
}) {
  return renderWelcomeEmail({
    productName: productConfig.name,
    userName: input.userName,
    dashboardUrl: input.dashboardUrl,
  });
}
