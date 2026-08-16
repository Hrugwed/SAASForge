import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextBinary = require.resolve("next/dist/bin/next");
const [command, networkScope, ...forwardedArguments] = process.argv.slice(2);

if (
  !["dev", "start"].includes(command) ||
  !["loopback", "hosted"].includes(networkScope)
) {
  throw new Error(
    "Factory launcher expects a Next.js command and a loopback or hosted network scope.",
  );
}

if (
  forwardedArguments.some(
    (argument) =>
      argument === "-H" ||
      argument.startsWith("-H") ||
      argument === "--hostname" ||
      argument.startsWith("--hostname="),
  )
) {
  throw new Error(
    "The factory launcher owns hostname binding; choose the loopback or hosted script instead.",
  );
}

const hostname = networkScope === "loopback" ? "127.0.0.1" : "0.0.0.0";
const child = spawn(
  process.execPath,
  [nextBinary, command, "--hostname", hostname, ...forwardedArguments],
  {
    env: {
      ...process.env,
      SAASFORGE_BOUND_NETWORK_SCOPE: networkScope,
    },
    stdio: "inherit",
    windowsHide: true,
  },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => child.kill(signal));
}

child.once("error", (error) => {
  throw error;
});

child.once("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exitCode = code ?? 1;
});
