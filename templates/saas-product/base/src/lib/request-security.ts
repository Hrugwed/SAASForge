import "server-only";

import { productConfig } from "./product-config";

export class RequestOriginError extends Error {
  override name = "RequestOriginError";
}

function allowedOrigins(): Set<string> {
  const appOrigin = new URL(productConfig.url);
  const origins = new Set([appOrigin.origin]);
  if (
    appOrigin.hostname === "localhost" ||
    appOrigin.hostname === "127.0.0.1"
  ) {
    const alias = new URL(appOrigin.origin);
    alias.hostname =
      appOrigin.hostname === "localhost" ? "127.0.0.1" : "localhost";
    origins.add(alias.origin);
  }
  return origins;
}

export function assertTrustedOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigins().has(origin)) {
    throw new RequestOriginError("The request origin is not trusted.");
  }
}
