"use client";

import { useState } from "react";

export function BillingActionButton({
  action,
  disabled = false,
  planKey,
}: {
  action: "checkout" | "portal";
  disabled?: boolean;
  planKey?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run() {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/billing/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: action === "checkout" ? JSON.stringify({ planKey }) : "{}",
    });
    const body = (await response.json().catch(() => null)) as {
      error?: string;
      url?: string;
    } | null;
    if (!response.ok || !body?.url) {
      setError(body?.error ?? "Billing is temporarily unavailable.");
      setPending(false);
      return;
    }
    const destination = new URL(body.url);
    if (destination.protocol !== "https:") {
      setError("The billing destination was rejected.");
      setPending(false);
      return;
    }
    window.location.assign(destination.href);
  }
  return (
    <div className="product-billing-action">
      <button disabled={disabled || pending} onClick={run} type="button">
        {pending
          ? "Opening Stripe..."
          : action === "portal"
            ? "Manage billing"
            : "Choose plan"}
      </button>
      <span aria-live="polite">{error}</span>
    </div>
  );
}
