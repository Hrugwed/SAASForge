import { createSaaSAuth } from "@saasforge/auth/server";
import { database } from "@saasforge/database";
import { productConfig } from "./product-config";

export const auth = createSaaSAuth({
  appName: productConfig.name,
  database,
});
