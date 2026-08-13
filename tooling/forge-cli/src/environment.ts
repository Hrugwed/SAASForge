import { readFile } from "node:fs/promises";

export type EnvironmentMap = Record<string, string>;

export function parseEnvironment(source: string): EnvironmentMap {
  const environment: EnvironmentMap = {};
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    environment[key] = value;
  }
  return environment;
}

export async function readEnvironment(file: string): Promise<EnvironmentMap> {
  return parseEnvironment(await readFile(file, "utf8"));
}

export function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const normalized = value.toLowerCase();
  return ["replace", "placeholder", "changeme", "change-me", "example"].some(
    (marker) => normalized.includes(marker),
  );
}
