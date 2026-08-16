import { describe, expect, it } from "vitest";
import { resolveFactoryOperatorPolicy } from "./factory-operator-policy";

describe("factory operator policy", () => {
  it("uses an explicitly configured organization on any host", () => {
    expect(
      resolveFactoryOperatorPolicy({
        canonicalUrl: "https://factory.example.com",
        requestHost: "factory.example.com",
        configuredOrganizationId: "factory_org-01",
        localModeEnabled: false,
        networkScope: "hosted",
      }),
    ).toEqual({
      mode: "organization",
      organizationId: "factory_org-01",
    });
  });

  it("rejects malformed configured organization identifiers", () => {
    expect(
      resolveFactoryOperatorPolicy({
        canonicalUrl: "https://factory.example.com",
        requestHost: "factory.example.com",
        configuredOrganizationId: "../other-organization",
        localModeEnabled: false,
        networkScope: "hosted",
      }),
    ).toEqual({ mode: "denied" });
  });

  it("allows the owner fallback only when canonical and request hosts are loopback", () => {
    expect(
      resolveFactoryOperatorPolicy({
        canonicalUrl: "http://localhost:3000",
        requestHost: "127.0.0.1:3000",
        configuredOrganizationId: null,
        localModeEnabled: true,
        networkScope: "loopback",
      }),
    ).toEqual({ mode: "local" });

    expect(
      resolveFactoryOperatorPolicy({
        canonicalUrl: "https://factory.example.com",
        requestHost: "localhost:3000",
        configuredOrganizationId: null,
        localModeEnabled: true,
        networkScope: "loopback",
      }),
    ).toEqual({ mode: "denied" });

    expect(
      resolveFactoryOperatorPolicy({
        canonicalUrl: "http://localhost:3000",
        requestHost: "factory.example.com",
        configuredOrganizationId: null,
        localModeEnabled: true,
        networkScope: "loopback",
      }),
    ).toEqual({ mode: "denied" });
  });

  it("denies local mode by default even when Host claims localhost", () => {
    expect(
      resolveFactoryOperatorPolicy({
        canonicalUrl: null,
        requestHost: "localhost:3000",
        configuredOrganizationId: null,
        localModeEnabled: false,
        networkScope: null,
      }),
    ).toEqual({ mode: "denied" });

    expect(
      resolveFactoryOperatorPolicy({
        canonicalUrl: "http://localhost:3000",
        requestHost: "localhost:3000",
        configuredOrganizationId: null,
        localModeEnabled: false,
        networkScope: "loopback",
      }),
    ).toEqual({ mode: "denied" });
  });

  it("denies local mode when the launcher exposes a hosted network scope", () => {
    expect(
      resolveFactoryOperatorPolicy({
        canonicalUrl: "http://localhost:3000",
        requestHost: "localhost:3000",
        configuredOrganizationId: null,
        localModeEnabled: true,
        networkScope: "hosted",
      }),
    ).toEqual({ mode: "denied" });
  });
});
