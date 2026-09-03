export function isSupportedNodeVersion(version) {
  const [major = 0, minor = 0] = version
    .replace(/^v/, "")
    .split(".")
    .map(Number);
  return major === 22 && minor >= 14;
}
