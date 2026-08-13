import path from "node:path";
import { fileURLToPath } from "node:url";
import { setupFactory } from "./setup";

const rootOption = process.argv.indexOf("--root");
const defaultRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const root =
  rootOption >= 0 && process.argv[rootOption + 1]
    ? path.resolve(process.argv[rootOption + 1]!)
    : defaultRoot;

try {
  const result = await setupFactory(root);
  console.log(
    result.created
      ? `Created ${result.environmentPath}`
      : `Kept existing ${result.environmentPath}`,
  );
  console.log("Next:");
  for (const command of result.next) console.log(`  ${command}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
