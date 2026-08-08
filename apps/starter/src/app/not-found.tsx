import Link from "next/link";
import { Button, Container } from "@saasforge/ui";

export default function NotFound() {
  return (
    <Container className="grid min-h-screen place-content-center gap-5 text-center">
      <p className="font-mono text-xs font-bold tracking-[0.18em] text-[var(--accent-dark)]">
        404 / NOT FOUNDRY
      </p>
      <h1 className="text-5xl font-black tracking-[-0.06em]">
        That route was never forged.
      </h1>
      <Button asChild>
        <Link href="/">Return home</Link>
      </Button>
    </Container>
  );
}
