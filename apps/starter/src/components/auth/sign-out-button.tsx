"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@saasforge/auth/client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await authClient.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <button
      className="sign-out-button"
      disabled={pending}
      onClick={signOut}
      type="button"
    >
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
