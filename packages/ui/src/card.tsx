import type { HTMLAttributes } from "react";
import { cn } from "./utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border border-[var(--line)] bg-[var(--surface)]",
        className,
      )}
      {...props}
    />
  );
}
