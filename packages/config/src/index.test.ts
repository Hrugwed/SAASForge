import { describe, expect, it } from "vitest";
import { defineProductConfig } from "./index";

describe("product configuration", () => {
  it("rejects unsafe or malformed launch configuration", () => {
    expect(() =>
      defineProductConfig({
        name: "x",
        description: "too short",
        url: "javascript:alert(1)",
        supportEmail: "not-an-email",
        brand: { accent: "red", foreground: "black" },
      }),
    ).toThrow();
  });
});
