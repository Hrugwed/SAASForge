import { describe, expect, it } from "vitest";
import { isSupportedNodeVersion } from "../../../templates/saas-product/repository/scripts/runtime.mjs";

describe("generated product runtime", () => {
  it("accepts only the declared Node 22.14 through 22.x range", () => {
    expect(isSupportedNodeVersion("v22.13.1")).toBe(false);
    expect(isSupportedNodeVersion("v22.14.0")).toBe(true);
    expect(isSupportedNodeVersion("v22.99.0")).toBe(true);
    expect(isSupportedNodeVersion("v23.0.0")).toBe(false);
    expect(isSupportedNodeVersion("v24.19.0")).toBe(false);
  });
});
