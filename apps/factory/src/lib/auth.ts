import { createSaaSAuth } from "@saasforge/auth/server";
import { database } from "@saasforge/database";
import { factoryConfig } from "./factory-config";

export const auth = createSaaSAuth({
  appName: factoryConfig.name,
  database,
});
