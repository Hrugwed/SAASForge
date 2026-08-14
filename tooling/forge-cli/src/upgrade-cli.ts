import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { upgradeProduct } from "./upgrade-product";

const factoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
try {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      product: { type: "string" },
      apply: { type: "boolean", default: false },
    },
    strict: true,
    allowPositionals: false,
  });
  if (!values.product) {
    throw new Error(
      "Usage: pnpm forge:upgrade -- --product <standalone-product-path> [--apply]",
    );
  }
  try {
    const result = await upgradeProduct(
      factoryRoot,
      path.resolve(values.product),
      {
        apply: values.apply,
      },
    );
    console.log(`Factory: ${result.fromVersion} -> ${result.toVersion}`);
    for (const key of [
      "added",
      "updated",
      "removed",
      "preserved",
      "unchanged",
      "conflicts",
    ] as const) {
      console.log(`${key}: ${result[key].length}`);
      for (const relative of result[key])
        console.log(`  [${key.toUpperCase()}] ${relative}`);
    }
    console.log(
      result.applied
        ? "Upgrade applied."
        : result.conflicts.length
          ? "No changes applied: resolve conflicts first."
          : values.apply
            ? "Already up to date; no changes applied."
            : "Dry run only: rerun with --apply to write changes.",
    );
    if (result.conflicts.length) process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
