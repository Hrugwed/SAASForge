import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCreateProductArguments } from "./blueprint-cli";
import { createProduct } from "./create-product";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
try {
  const input = parseCreateProductArguments(process.argv.slice(2));
  const result = await createProduct(repositoryRoot, input);
  console.log(`Created ${result.input.name} at ${result.target}`);
  console.log(
    "The output is a self-contained repository. Run pnpm install inside it, then verify the product.",
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
