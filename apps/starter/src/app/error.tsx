"use client";

import { useEffect } from "react";
import { Button, Container } from "@saasforge/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="grid min-h-screen place-content-center gap-5 text-center">
      <p className="font-mono text-xs font-bold tracking-[0.18em] text-[var(--accent-dark)]">
        RECOVERABLE ERROR
      </p>
      <h1 className="text-5xl font-black tracking-[-0.06em]">
        The forge needs another pass.
      </h1>
      <Button onClick={reset}>Try again</Button>
    </Container>
  );
}
