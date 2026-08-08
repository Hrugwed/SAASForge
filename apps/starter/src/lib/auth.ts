import { createSaaSAuth } from "@saasforge/auth/server";
import { productConfig } from "@saasforge/config";
import { database } from "@saasforge/database";

export const auth = createSaaSAuth({
  appName: productConfig.name,
  database,
});
