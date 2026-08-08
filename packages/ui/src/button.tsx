import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "./utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost" | "dark";
};

const variants = {
  primary:
    "border-[var(--ink)] bg-[var(--accent)] text-white shadow-[4px_4px_0_var(--ink)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--ink)]",
  secondary:
    "border-[var(--ink)] bg-[var(--surface)] text-[var(--ink)] shadow-[3px_3px_0_var(--ink)] hover:-translate-y-0.5",
  ghost: "border-transparent bg-transparent text-[var(--ink)] hover:bg-black/5",
  dark: "border-[var(--ink)] bg-[var(--ink)] text-white shadow-[4px_4px_0_rgba(255,255,255,0.35)] hover:-translate-y-0.5",
};

const sizes = {
  sm: "min-h-9 px-4 text-xs",
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-13 px-7 text-sm",
};

export function buttonStyles({
  className,
  size = "md",
  variant = "primary",
}: Pick<ButtonProps, "className" | "size" | "variant"> = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 border-2 font-extrabold tracking-[-0.015em] transition-[transform,box-shadow,background-color] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--accent)] disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  asChild,
  className,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      className={buttonStyles({ className, size, variant })}
      type={asChild ? undefined : type}
      {...props}
    />
  );
}
