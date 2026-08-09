"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Command center" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/modules", label: "Modules" },
  { href: "/dashboard#playbooks", label: "Playbooks" },
  { href: "/dashboard#settings", label: "Settings" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Factory navigation">
      {links.map((link) => {
        const active =
          link.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === link.href;

        return (
          <Link
            className={active ? "active" : undefined}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
