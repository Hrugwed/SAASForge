import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  createReferenceProduct,
  referenceProductProfiles,
} from "./reference-product";
import type { ReferenceProductProfile } from "./reference-product";

function option(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const profile = option("profile");
const output = option("output");

if (!profile || !(profile in referenceProductProfiles) || !output) {
  console.error(
    "Usage: pnpm reference:create -- --profile lean|full --output <absolute-temporary-path>",
  );
  process.exitCode = 1;
} else {
  try {
    const result = await createReferenceProduct(
      repositoryRoot,
      profile as ReferenceProductProfile,
      output,
    );
    console.log(
      `Generated ${profile} standalone reference with ${result.manifest.managedFiles ? Object.keys(result.manifest.managedFiles).length : 0} managed files.`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
