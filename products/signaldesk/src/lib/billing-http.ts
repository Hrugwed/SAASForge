import "server-only";

import {
  BillingConfigurationError,
  BillingConflictError,
  BillingNotFoundError,
  BillingSecurityError,
} from "@saasforge/billing/server";
import { RequestOriginError } from "./request-security";

export function billingErrorResponse(error: unknown): Response {
  if (
    error instanceof RequestOriginError ||
    error instanceof BillingSecurityError
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (error instanceof BillingConflictError)
    return Response.json({ error: error.message }, { status: 409 });
  if (error instanceof BillingNotFoundError)
    return Response.json({ error: error.message }, { status: 404 });
  if (error instanceof BillingConfigurationError)
    return Response.json(
      { error: "Product billing is not configured yet." },
      { status: 503 },
    );
  console.error("Billing request failed", error);
  return Response.json(
    { error: "Billing is temporarily unavailable." },
    { status: 500 },
  );
}
