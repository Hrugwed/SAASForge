import Link from "next/link";
import { Button, Card, Container } from "@saasforge/ui";
import { SignOutButton } from "@/components/auth/sign-out-button";
import "./modules.css";

const modules = [
  {
    name: "Identity",
    status: "Ready",
    detail:
      "Protected sessions, organizations, roles, and server-side authorization.",
  },
  {
    name: "Data",
    status: "Ready",
    detail:
      "PostgreSQL, Prisma migrations, tenant boundaries, and audit events.",
  },
  {
    name: "Billing",
    status: "Ready",
    detail:
      "Stripe adapter, signed webhooks, internal subscriptions, and entitlements.",
    href: "/dashboard/modules/billing",
  },
  {
    name: "Email",
    status: "Ready",
    detail:
      "Validated transactional messages, provider adapters, and reusable templates.",
  },
  {
    name: "Analytics",
    status: "Ready",
    detail:
      "Provider-neutral, validated product events without analytics payloads leaking into features.",
  },
];

export const metadata = {
  title: "Factory modules",
  robots: { index: false, follow: false },
};

export default function ModulesPage() {
  return (
    <Container className="dashboard-container modules-container">
      <header className="dashboard-header">
        <div>
          <p>REUSABLE CAPABILITIES</p>
          <h1>Modules power products. They are not products.</h1>
          <span>
            Each future SaaS takes only the capabilities it needs, while owning
            its own data, credentials, domain, pricing, and deployment.
          </span>
        </div>
        <div className="dashboard-actions">
          <Button asChild variant="secondary">
            <Link href="/dashboard">Back to command center</Link>
          </Button>
          <SignOutButton />
        </div>
      </header>

      <section className="module-grid" aria-label="Factory module readiness">
        {modules.map((module) => (
          <Card className="module-card" key={module.name}>
            <div className="module-card-topline">
              <span>MODULE</span>
              <strong
                className={module.status === "Ready" ? "ready" : undefined}
              >
                {module.status}
              </strong>
            </div>
            <h2>{module.name}</h2>
            <p>{module.detail}</p>
            {module.href ? (
              <Link className="module-link" href={module.href}>
                Inspect module →
              </Link>
            ) : (
              <span className="module-soon">Available to the generator</span>
            )}
          </Card>
        ))}
      </section>
    </Container>
  );
}
