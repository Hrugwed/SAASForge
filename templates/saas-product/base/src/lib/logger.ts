import "server-only";
import { createLogger } from "@saasforge/observability";

export const logger = createLogger({ service: "__PRODUCT_SLUG__" });
