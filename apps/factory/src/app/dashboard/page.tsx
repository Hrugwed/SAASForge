import Link from "next/link";
import { Button, Card, Container } from "@saasforge/ui";
import { SignOutButton } from "@/components/auth/sign-out-button";
import products from "@/generated/products.json";
import { requireSession } from "@/lib/session";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await requireSession();
  const firstName = session.user.name.trim().split(/\s+/)[0] || "maker";
  const metrics = [
    { label: "Factory modules", value: "8", change: "Reusable foundations" },
    {
      label: "Generated products",
      value: String(products.length),
      change:
        products.length === 0
          ? "First product comes next"
          : "Registered locally",
    },
    {
      label: "Launch target",
      value: "3–7 days",
      change: "With a validated idea",
    },
    { label: "System health", value: "100%", change: "Private factory online" },
  ];

  return (
    <Container className="dashboard-container" id="overview">
      <header className="dashboard-header">
        <div>
          <p>PRIVATE FACTORY CONTROL CENTER</p>
          <h1>Good morning, {firstName}.</h1>
          <span>
            Your private operating system is ready to turn the next validated
            idea into an isolated SaaS product.
          </span>
        </div>
        <div className="dashboard-actions">
          <Button asChild variant="secondary">
            <Link href="/">Factory overview</Link>
          </Button>
          <SignOutButton />
        </div>
      </header>

      <section className="metric-grid" aria-label="Factory metrics">
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
            <span>8 / 8</span>
          </div>
          <div className="setup-list">
            {[
              ["Design system", "complete"],
              ["CI quality gates", "complete"],
              ["Database foundation", "complete"],
              ["Authentication module", "complete"],
              ["Billing engine", "complete"],
              ["Product generator", "complete"],
              ["Email", "complete"],
              ["Analytics", "complete"],
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
            <strong>Private factory foundation online</strong>
            <p>
              Signed in as {session.user.email}. The next step is to generate a
              disposable product from the maintained template and complete its
              provider-specific launch review.
            </p>
          </div>
        </Card>
      </section>
    </Container>
  );
}
