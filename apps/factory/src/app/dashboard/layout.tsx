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
  const workspaceName = membership?.organization.name ?? "Workspace pending";
  const workspaceRole = membership?.role ?? "No role";

  return (
    <div className="dashboard-shell">
      <a className="dashboard-skip-link" href="#dashboard-main">
        Skip to dashboard content
      </a>
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-topline">
          <Link className="dashboard-brand" href="/">
            <span aria-hidden="true" className="dashboard-brand-mark">
              <span>SF</span>
            </span>
            <span>
              <strong>{factoryConfig.name}</strong>
              <small>Private factory</small>
            </span>
          </Link>
          <span className="dashboard-environment">
            <i aria-hidden="true" /> Local control
          </span>
        </div>
        <DashboardNav
          workspaceName={workspaceName}
          workspaceRole={workspaceRole}
        />
        <div className="sidebar-footer">
          <span className="sidebar-footer-label">Current workspace</span>
          <div>
            <span aria-hidden="true" className="workspace-avatar">
              {workspaceName.charAt(0).toUpperCase()}
            </span>
            <span className="workspace-copy">
              <strong>{workspaceName}</strong>
              <small>{workspaceRole}</small>
            </span>
          </div>
        </div>
      </aside>
      <main className="dashboard-main" id="dashboard-main">
        {children}
      </main>
    </div>
  );
}
