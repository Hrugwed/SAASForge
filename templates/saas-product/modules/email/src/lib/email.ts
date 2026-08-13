import "server-only";
import {
  createEmailService,
  localEmailProvider,
  renderWelcomeEmail,
} from "@saasforge/email";
import { createResendEmailProvider } from "@saasforge/email/server";
import { productConfig } from "./product-config";
import { logger } from "./logger";

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

export async function sendProductEmail(
  message: Parameters<ReturnType<typeof createEmailService>["send"]>[0],
) {
  try {
    const delivery = await getEmailService().send(message);
    logger.info(
      {
        attempts: delivery.attempts,
        providerMessageId: delivery.providerMessageId,
        tags: message.tags,
      },
      "Transactional email accepted",
    );
    return delivery;
  } catch (error) {
    logger.error(
      { error, tags: message.tags },
      "Transactional email delivery failed",
    );
    throw error;
  }
}
