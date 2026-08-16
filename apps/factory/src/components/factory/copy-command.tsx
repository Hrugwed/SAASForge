"use client";

import { useState } from "react";

export function CopyCommand({
  command,
  label,
}: {
  command: string;
  label: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "manual">("idle");

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(command);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 1800);
    } catch {
      setStatus("manual");
    }
  }

  return (
    <div className="product-command-row">
      <div>
        <span>{label}</span>
        <code>{command}</code>
      </div>
      <button onClick={copy} type="button">
        {status === "copied"
          ? "COPIED"
          : status === "manual"
            ? "SELECT"
            : "COPY"}
      </button>
      <span aria-live="polite" className="sr-only">
        {status === "copied"
          ? `${label} command copied.`
          : status === "manual"
            ? "Clipboard unavailable. Select the command manually."
            : ""}
      </span>
    </div>
  );
}
