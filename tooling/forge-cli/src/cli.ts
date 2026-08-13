import path from "node:path";
import { fileURLToPath } from "node:url";
import { createProduct } from "./create-product";

function option(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const name = option("name");
const slug = option("slug");
const description = option("description");
const modules = (option("modules") ?? "auth")
  .split(",")
  .map((moduleName) => moduleName.trim())
  .filter(Boolean);

if (!name || !slug || !description) {
  console.error(
    "Usage: pnpm forge:create --name <name> --slug <slug> --description <description> --modules auth,billing,email,analytics,jobs,storage",
  );
  process.exitCode = 1;
} else {
  try {
    const result = await createProduct(repositoryRoot, {
      name,
      slug,
      description,
      modules: modules as (
        "auth" | "billing" | "email" | "analytics" | "jobs" | "storage"
      )[],
    });
    console.log(`Created ${result.input.name} at ${result.target}`);
    console.log(
      "The output is a self-contained repository. Run pnpm install inside it, then verify the product.",
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
