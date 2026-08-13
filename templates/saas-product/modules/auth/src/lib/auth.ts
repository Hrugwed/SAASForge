import { createSaaSAuth } from "@saasforge/auth/server";
import { database } from "@saasforge/database";
import { after } from "next/server";
import { sendAuthEmail } from "./auth-email";
import { productConfig } from "./product-config";

export const auth = createSaaSAuth({
  appName: productConfig.name,
  database,
  requireEmailVerification:
    process.env.AUTH_REQUIRE_EMAIL_VERIFICATION !== "false",
  schedule: (task) => after(task),
  sendAuthEmail,
});
