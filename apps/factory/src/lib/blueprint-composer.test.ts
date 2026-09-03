import { describe, expect, it } from "vitest";

import {
  buildBlueprintExport,
  slugifyProductName,
  toggleProductModule,
} from "./blueprint-composer";

describe("dashboard blueprint composer", () => {
  it("normalizes a product name into the generator slug contract", () => {
    expect(slugifyProductName("  Creme & Signal Desk  ")).toBe(
      "creme-signal-desk",
    );
    expect(slugifyProductName("---")).toBe("");
  });

  it("adds and locks auth for tenant-owned modules", () => {
    expect(toggleProductModule([], "billing")).toEqual(["auth", "billing"]);
    expect(toggleProductModule(["auth", "billing"], "auth")).toEqual([
      "auth",
      "billing",
    ]);
    expect(toggleProductModule(["auth", "billing"], "billing")).toEqual([
      "auth",
    ]);
  });

  it("builds validated JSON and a shell-safe encoded command", () => {
    const result = buildBlueprintExport({
      name: "Signal Desk",
      slug: "signal-desk",
      description:
        "Turn noisy customer feedback into clear product priorities.",
      modules: ["auth", "billing", "analytics"],
    });

    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.document.outputMode).toBe("standalone");
    expect(result.packages).toEqual([
      "analytics",
      "auth",
      "billing",
      "config",
      "database",
      "email",
      "observability",
      "ui",
    ]);
    expect(result.command).toMatch(
      /^pnpm forge:create -- --blueprint [A-Za-z0-9_-]+$/,
    );
    expect(JSON.parse(result.json)).toEqual(result.document);
  });

  it("returns field errors instead of exporting an invalid draft", () => {
    const result = buildBlueprintExport({
      name: "X",
      slug: "../unsafe",
      description: "too short",
      modules: ["billing"],
    });

    expect(result.valid).toBe(false);
    if (result.valid) return;
    expect(result.errors.name).toBeDefined();
    expect(result.errors.slug).toBeDefined();
    expect(result.errors.description).toBeDefined();
    expect(result.errors.modules).toContain(
      "The billing module requires the auth module.",
    );
  });
});
