import Link from "next/link";
import { DashboardNav } from "@/components/factory/dashboard-nav";
import { factoryConfig } from "@/lib/factory-config";
import { getPrimaryMembership } from "@/lib/organization";
import { requireSession } from "@/lib/session";
import "./dashboard.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const membership = await getPrimaryMembership(session.user.id);

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link className="brand" href="/">
          <span aria-hidden="true" className="forge-mark">
            SF
          </span>
          <span>{factoryConfig.name}</span>
        </Link>
        <DashboardNav />
        <div className="sidebar-footer">
          <span>Private workspace</span>
          <strong>
            {membership?.organization.name ?? "Workspace pending"}
          </strong>
          <small>{membership?.role ?? "No role"}</small>
        </div>
      </aside>
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
