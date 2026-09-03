import { Buffer } from "node:buffer";

import {
  createProductInputSchema,
  productBlueprintDocumentSchema,
} from "./product-blueprint";
import type { CreateProductInput } from "./product-blueprint";

function option(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
}

export function decodeProductBlueprint(encoded: string): CreateProductInput {
  if (!encoded || encoded.length > 4_096 || !/^[A-Za-z0-9_-]+$/.test(encoded)) {
    throw new Error("Encoded product blueprint is invalid.");
  }

  const bytes = Buffer.from(encoded, "base64url");
  if (bytes.toString("base64url") !== encoded) {
    throw new Error("Encoded product blueprint is not canonical base64url.");
  }

  let value: unknown;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error("Encoded product blueprint does not contain valid JSON.");
  }
  return productBlueprintDocumentSchema.parse(value).product;
}

export function parseCreateProductArguments(
  args: readonly string[],
): CreateProductInput {
  const blueprint = option(args, "blueprint");
  const explicitOptions = ["name", "slug", "description", "modules"].some(
    (name) => option(args, name) !== undefined,
  );
  if (blueprint) {
    if (explicitOptions) {
      throw new Error(
        "Use either --blueprint or explicit product options, not both.",
      );
    }
    return decodeProductBlueprint(blueprint);
  }

  const name = option(args, "name");
  const slug = option(args, "slug");
  const description = option(args, "description");
  if (!name || !slug || !description) {
    throw new Error(
      "Usage: pnpm forge:create -- --blueprint <base64url> or --name <name> --slug <slug> --description <description> --modules auth,billing,email,analytics,jobs,storage",
    );
  }
  return createProductInputSchema.parse({
    name,
    slug,
    description,
    modules: (option(args, "modules") ?? "auth")
      .split(",")
      .map((moduleName) => moduleName.trim())
      .filter(Boolean),
  });
}
