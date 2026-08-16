export type FactoryOperatorPolicyInput = {
  canonicalUrl: string | null;
  requestHost: string | null;
  configuredOrganizationId: string | null;
  localModeEnabled: boolean;
  networkScope: string | null;
};

export type FactoryOperatorPolicy =
  | { mode: "organization"; organizationId: string }
  | { mode: "local" }
  | { mode: "denied" };

function hostname(value: string, base?: string): string | null {
  try {
    return new URL(value, base).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isLoopback(value: string | null): boolean {
  return value === "localhost" || value === "127.0.0.1" || value === "::1";
}

export function resolveFactoryOperatorPolicy(
  input: FactoryOperatorPolicyInput,
): FactoryOperatorPolicy {
  if (input.configuredOrganizationId) {
    if (/^[A-Za-z0-9_-]{1,128}$/.test(input.configuredOrganizationId)) {
      return {
        mode: "organization",
        organizationId: input.configuredOrganizationId,
      };
    }
    return { mode: "denied" };
  }

  if (
    !input.localModeEnabled ||
    input.networkScope !== "loopback" ||
    !input.canonicalUrl
  ) {
    return { mode: "denied" };
  }

  const canonicalHost = hostname(input.canonicalUrl);
  const requestHost = input.requestHost
    ? hostname(`http://${input.requestHost}`)
    : null;
  return isLoopback(canonicalHost) && isLoopback(requestHost)
    ? { mode: "local" }
    : { mode: "denied" };
}
