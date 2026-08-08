import { describe, expect, it } from "vitest";
import { belongsToOrganization, hasOrganizationPermission } from "./access";

describe("organization authorization", () => {
  it("rejects cross-tenant access even when the user belongs elsewhere", () => {
    const membership = {
      organizationId: "organization-a",
      userId: "user-1",
    };

    expect(
      belongsToOrganization(membership, {
        organizationId: "organization-b",
        userId: "user-1",
      }),
    ).toBe(false);
  });

  it("rejects another user in the same organization", () => {
    const membership = {
      organizationId: "organization-a",
      userId: "user-1",
    };

    expect(
      belongsToOrganization(membership, {
        organizationId: "organization-a",
        userId: "user-2",
      }),
    ).toBe(false);
  });

  it("grants billing management only to owners", () => {
    expect(hasOrganizationPermission("owner", "billing:manage")).toBe(true);
    expect(hasOrganizationPermission("admin", "billing:manage")).toBe(false);
    expect(hasOrganizationPermission("member", "billing:manage")).toBe(false);
    expect(hasOrganizationPermission("unknown", "billing:manage")).toBe(false);
  });
});
