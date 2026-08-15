import Link from "next/link";
import { Button, Card, Container } from "@saasforge/ui";
import { SignOutButton } from "@/components/auth/sign-out-button";
import "./modules.css";

type ModuleDefinition = {
  code: string;
  name: string;
  status: "Ready";
  detail: string;
  output: string;
  href?: string;
};

const modules: readonly ModuleDefinition[] = [
  {
    code: "AUTH",
    name: "Identity",
    status: "Ready",
    detail:
      "Protected sessions, organizations, roles, and server-side authorization.",
    output: "packages/auth",
  },
  {
    code: "BILL",
    name: "Billing",
    status: "Ready",
    detail:
      "Stripe adapter, signed webhooks, internal subscriptions, and entitlements.",
    output: "packages/billing",
    href: "/dashboard/modules/billing",
  },
  {
    code: "MAIL",
    name: "Email",
    status: "Ready",
    detail:
      "Validated transactional messages, provider adapters, and reusable templates.",
    output: "packages/email",
  },
  {
    code: "DATA",
    name: "Analytics",
    status: "Ready",
    detail:
      "Provider-neutral, validated product events without analytics payloads leaking into features.",
    output: "packages/analytics",
  },
  {
    code: "JOBS",
    name: "Jobs",
    status: "Ready",
    detail:
      "Retryable background work with explicit handlers and workspace-scoped execution.",
    output: "packages/jobs",
  },
  {
    code: "FILE",
    name: "Storage",
    status: "Ready",
    detail:
      "Private object access, signed upload boundaries, and tenant-owned file records.",
    output: "packages/storage",
  },
];

const foundations = ["CONFIG", "DATABASE", "UI", "OBSERVABILITY"] as const;

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
          <h1>Six capabilities. Composed only when needed.</h1>
          <span>
            The generator combines capability overlays with their dependency
            closure. Every product still owns its data, credentials, brand,
            domain, pricing, and deployment.
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
        {modules.map((module, index) => (
          <Card className="module-card" key={module.name}>
            <div className="module-card-topline">
              <span>
                {String(index + 1).padStart(2, "0")} / {module.code}
              </span>
              <strong
                className={module.status === "Ready" ? "ready" : undefined}
              >
                {module.status}
              </strong>
            </div>
            <h2>{module.name}</h2>
            <p>{module.detail}</p>
            <code>{module.output}</code>
            {module.href ? (
              <Link className="module-link" href={module.href}>
                Inspect capability →
              </Link>
            ) : (
              <span className="module-soon">Composable now</span>
            )}
          </Card>
        ))}
      </section>

      <section className="module-foundation" aria-labelledby="foundation-title">
        <div>
          <p>DEPENDENCY CLOSURE</p>
          <h2 id="foundation-title">The quiet foundation travels with them.</h2>
          <span>
            These packages are included when required by a selected capability,
            so products receive the contract without copying the whole factory.
          </span>
        </div>
        <ul>
          {foundations.map((foundation, index) => (
            <li key={foundation}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{foundation}</strong>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
