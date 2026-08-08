import Link from "next/link";
import { productConfig } from "@saasforge/config";
import { Button, Card, Container } from "@saasforge/ui";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getPrimaryMembership } from "@/lib/organization";
import { requireSession } from "@/lib/session";

const metrics = [
  { label: "Database", value: "Ready", change: "PostgreSQL + Prisma" },
  { label: "Identity", value: "Ready", change: "Better Auth" },
  { label: "MRR", value: "$0", change: "Connect billing" },
  { label: "System health", value: "100%", change: "Foundation ready" },
];

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await requireSession();
  const membership = await getPrimaryMembership(session.user.id);
  const firstName = session.user.name.trim().split(/\s+/)[0] || "maker";

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link className="brand" href="/">
          <span aria-hidden="true" className="forge-mark">
            SF
          </span>
          <span>{productConfig.name}</span>
        </Link>
        <nav aria-label="Dashboard navigation">
          <a className="active" href="#overview">
            Overview
          </a>
          <a href="#product">Product</a>
          <a href="#customers">Customers</a>
          <a href="#billing">Billing</a>
          <a href="#settings">Settings</a>
        </nav>
        <div className="sidebar-footer">
          <span>Active workspace</span>
          <strong>
            {membership?.organization.name ?? "Workspace pending"}
          </strong>
          <small>{membership?.role ?? "No role"}</small>
        </div>
      </aside>

      <main className="dashboard-main" id="overview">
        <Container className="dashboard-container">
          <header className="dashboard-header">
            <div>
              <p>PRODUCT COMMAND CENTER</p>
              <h1>Good morning, {firstName}.</h1>
              <span>
                Your session is server-verified and your isolated workspace is
                ready for its first product workflow.
              </span>
            </div>
            <div className="dashboard-actions">
              <Button asChild variant="secondary">
                <Link href="/">View marketing site</Link>
              </Button>
              <SignOutButton />
            </div>
          </header>

          <section className="metric-grid" aria-label="Product metrics">
            {metrics.map((metric) => (
              <Card className="metric-card" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.change}</small>
              </Card>
            ))}
          </section>

          <section className="dashboard-grid">
            <Card className="setup-card">
              <div className="card-heading">
                <div>
                  <p>LAUNCH READINESS</p>
                  <h2>Factory setup</h2>
                </div>
                <span>4 / 8</span>
              </div>
              <div className="setup-list">
                {[
                  ["Design system", "complete"],
                  ["CI quality gates", "complete"],
                  ["Database", "complete"],
                  ["Authentication", "complete"],
                  ["Billing", "next"],
                  ["Email", "planned"],
                  ["Analytics", "planned"],
                  ["Production deployment", "planned"],
                ].map(([label, status]) => (
                  <div className="setup-row" key={label}>
                    <span className={`setup-indicator ${status}`} />
                    <strong>{label}</strong>
                    <span>{status}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="activity-card">
              <div className="card-heading">
                <div>
                  <p>ACTIVITY</p>
                  <h2>System events</h2>
                </div>
              </div>
              <div className="empty-state">
                <span>SF</span>
                <strong>Identity foundation online</strong>
                <p>
                  Signed in as {session.user.email}. Audit, billing, email, and
                  product events will appear here as modules come online.
                </p>
              </div>
            </Card>
          </section>
        </Container>
      </main>
    </div>
  );
}
