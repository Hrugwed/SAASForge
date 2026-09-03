import { describe, expect, it } from "vitest";

import { encodeProductBlueprint } from "./product-blueprint";
import type { CreateProductInput } from "./product-blueprint";
import {
  decodeProductBlueprint,
  parseCreateProductArguments,
} from "./blueprint-cli";

const input: CreateProductInput = {
  name: 'Signal Desk "North"',
  slug: "signal-desk",
  description:
    "Turn customer feedback into priorities without running shell text: $(whoami).",
  modules: ["auth", "billing", "analytics"],
};

describe("encoded product blueprint CLI input", () => {
  it("round-trips validated Unicode and shell-like text as base64url", () => {
    const encoded = encodeProductBlueprint(input);

    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeProductBlueprint(encoded)).toEqual(input);
    expect(parseCreateProductArguments(["--blueprint", encoded])).toEqual(
      input,
    );
  });

  it("rejects malformed, noncanonical, and ambiguous input", () => {
    expect(() => decodeProductBlueprint("not+base64")).toThrow("invalid");
    expect(() => decodeProductBlueprint("a")).toThrow("not canonical");
    expect(() =>
      parseCreateProductArguments([
        "--blueprint",
        encodeProductBlueprint(input),
        "--slug",
        "another-product",
      ]),
    ).toThrow("either --blueprint or explicit product options");
  });

  it("preserves explicit CLI input compatibility", () => {
    expect(
      parseCreateProductArguments([
        "--name",
        "Signal Desk",
        "--slug",
        "signal-desk",
        "--description",
        "Turn customer feedback into clear product priorities.",
        "--modules",
        "auth,analytics",
      ]),
    ).toEqual({
      name: "Signal Desk",
      slug: "signal-desk",
      description: "Turn customer feedback into clear product priorities.",
      modules: ["auth", "analytics"],
    });
  });
});
