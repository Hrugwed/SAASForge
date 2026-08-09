import { renderWelcomeEmail } from "@saasforge/email";
import { productConfig } from "./product-config";

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

// Connect a production EmailProvider only inside this product's server code.
