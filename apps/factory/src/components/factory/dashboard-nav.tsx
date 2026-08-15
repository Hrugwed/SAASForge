"use client";

import Link from "next/link";
import { useRef } from "react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Command center", code: "01" },
  { href: "/dashboard/products", label: "Products", code: "02" },
  { href: "/dashboard/modules", label: "Modules", code: "03" },
];

type DashboardNavProps = {
  workspaceName: string;
  workspaceRole: string;
};

export function DashboardNav({
  workspaceName,
  workspaceRole,
}: DashboardNavProps) {
  const pathname = usePathname();
  const mobileNavigation = useRef<HTMLDetailsElement>(null);

  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function navigationLinks(closeMobile = false) {
    return links.map((link) => {
      const active = isActive(link.href);

      return (
        <Link
          aria-current={active ? "page" : undefined}
          className={active ? "active" : undefined}
          href={link.href}
          key={link.href}
          onClick={
            closeMobile
              ? () => mobileNavigation.current?.removeAttribute("open")
              : undefined
          }
        >
          <span aria-hidden="true">{link.code}</span>
          <strong>{link.label}</strong>
          <i aria-hidden="true">↗</i>
        </Link>
      );
    });
  }

  return (
    <div className="dashboard-navigation">
      <p>Factory navigation</p>
      <nav aria-label="Factory navigation" className="dashboard-desktop-nav">
        {navigationLinks()}
      </nav>
      <details className="dashboard-mobile-nav" ref={mobileNavigation}>
        <summary>
          <span>Navigate</span>
          <strong>{links.find((link) => isActive(link.href))?.label}</strong>
        </summary>
        <div className="dashboard-mobile-menu">
          <nav aria-label="Mobile factory navigation">
            {navigationLinks(true)}
          </nav>
          <div className="mobile-workspace-card">
            <span aria-hidden="true">
              {workspaceName.charAt(0).toUpperCase()}
            </span>
            <div>
              <small>Current workspace</small>
              <strong>{workspaceName}</strong>
              <i>{workspaceRole}</i>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
