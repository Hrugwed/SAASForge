export class BillingConfigurationError extends Error {
  override name = "BillingConfigurationError";
}

export class BillingConflictError extends Error {
  override name = "BillingConflictError";
}

export class BillingNotFoundError extends Error {
  override name = "BillingNotFoundError";
}

export class BillingSecurityError extends Error {
  override name = "BillingSecurityError";
}
