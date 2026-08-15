"use client";

import Link from "next/link";
import { useRef } from "react";

type MobileNavigationProps = {
  className: string;
};

export function MobileNavigation({ className }: MobileNavigationProps) {
  const menuRef = useRef<HTMLDetailsElement>(null);

  function closeMenu(): void {
    menuRef.current?.removeAttribute("open");
  }

  return (
    <details className={className} ref={menuRef}>
      <summary>Menu</summary>
      <nav aria-label="Mobile SaaSForge overview">
        <a href="#blueprint" onClick={closeMenu}>
          Blueprint
        </a>
        <a href="#isolation" onClick={closeMenu}>
          Isolation
        </a>
        <a href="#agents" onClick={closeMenu}>
          AI native
        </a>
        <a href="#upgrades" onClick={closeMenu}>
          Upgrades
        </a>
        <a href="#evidence" onClick={closeMenu}>
          Evidence
        </a>
        <Link href="/dashboard" onClick={closeMenu}>
          Open factory
        </Link>
      </nav>
    </details>
  );
}
