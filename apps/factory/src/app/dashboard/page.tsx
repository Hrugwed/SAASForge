import Link from "next/link";
import { Container } from "@saasforge/ui";
import { SignOutButton } from "@/components/auth/sign-out-button";
import products from "@/generated/products.json";
import { requireSession } from "@/lib/session";

export const metadata = {
  title: "Dashboard",
};

const capabilityRows = [
  { name: "Identity", code: "AUTH", tone: "lime" },
  { name: "Billing", code: "PAY", tone: "violet" },
  { name: "Email", code: "MAIL", tone: "orange" },
  { name: "Analytics", code: "DATA", tone: "blue" },
  { name: "Jobs", code: "QUEUE", tone: "lime" },
  { name: "Storage", code: "FILES", tone: "violet" },
] as const;

const verificationRows = [
  {
    label: "Blueprint composition",
    detail: "Validated input and dependency closure",
  },
  {
    label: "Managed-file upgrades",
    detail: "Dry-run first with conflict protection",
  },
  {
    label: "Repository quality gates",
    detail: "Formatting, lint, types, tests, and build",
  },
  {
    label: "Production approval",
    detail: "Completed separately for every product",
  },
] as const;

export default async function DashboardPage() {
  const session = await requireSession();
  const firstName = session.user.name.trim().split(/\s+/)[0] || "maker";
  const productCount = products.length;
  const metrics = [
    {
      label: "Generated products",
      value: String(productCount).padStart(2, "0"),
      detail:
        productCount === 0 ? "No local products yet" : "Registered locally",
      tone: "orange",
    },
    {
      label: "Selectable modules",
      value: "06",
      detail: "Composed per blueprint",
      tone: "lime",
    },
    {
      label: "Upgrade mode",
      value: "DRY",
      detail: "Review before apply",
      tone: "violet",
    },
    {
      label: "Evidence scope",
      value: "LOCAL",
      detail: "Production is product-owned",
      tone: "blue",
    },
  ] as const;

  return (
    <Container className="dashboard-container" id="overview">
      <header className="dashboard-header">
        <div className="dashboard-heading-copy">
          <p>
            <span aria-hidden="true" /> PRIVATE FACTORY / COMMAND CENTER
          </p>
          <h1>Good morning, {firstName}.</h1>
          <span>
            Compose the maintained foundation, then build the customer advantage
            inside an independently owned product.
          </span>
        </div>
        <div className="dashboard-actions">
          <Link className="dashboard-overview-link" href="/">
            Factory overview <span aria-hidden="true">↗</span>
          </Link>
          <SignOutButton />
        </div>
      </header>

      <section className="metric-grid" aria-label="Factory snapshot">
        {metrics.map((metric, index) => (
          <article
            className="metric-card"
            data-tone={metric.tone}
            key={metric.label}
          >
            <div>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <i aria-hidden="true" />
            </div>
            <strong>{metric.value}</strong>
            <footer>
              <span>{metric.label}</span>
              <small>{metric.detail}</small>
            </footer>
          </article>
        ))}
      </section>

      <section className="dashboard-grid" aria-label="Factory operations">
        <article className="dashboard-panel launch-panel">
          <header className="panel-heading">
            <div>
              <p>01 / NEXT BUILD</p>
              <h2>Forge the next product foundation.</h2>
            </div>
            <span className="panel-status">
              <i aria-hidden="true" /> Generator available
            </span>
          </header>

          <ol className="forge-steps">
            <li>
              <span>01</span>
              <div>
                <strong>Define the blueprint</strong>
                <p>
                  Name the product and select only the capabilities it needs.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Compose the repository</strong>
                <p>
                  Generate the standalone source, manifest, and operations kit.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Prove the product</strong>
                <p>
                  Configure its providers and record launch-specific evidence.
                </p>
              </div>
            </li>
          </ol>

          <div className="forge-command">
            <span>RUN FROM THE FACTORY REPOSITORY</span>
            <code>pnpm forge:create -- --name &quot;Next Product&quot;</code>
          </div>

          <footer className="panel-actions">
            <Link href="/dashboard/products">
              View product registry <span aria-hidden="true">→</span>
            </Link>
            <small>Generation remains an intentional CLI operation.</small>
          </footer>
        </article>

        <article className="dashboard-panel verification-panel">
          <header className="panel-heading">
            <div>
              <p>02 / OPERATING POSTURE</p>
              <h2>Evidence before claims.</h2>
            </div>
          </header>

          <div className="verification-list">
            {verificationRows.map((row, index) => (
              <div key={row.label}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{row.label}</strong>
                  <small>{row.detail}</small>
                </div>
              </div>
            ))}
          </div>

          <div className="signed-in-card">
            <span>SIGNED-IN OPERATOR</span>
            <strong>{session.user.name}</strong>
            <small>{session.user.email}</small>
          </div>
        </article>
      </section>

      <section className="dashboard-lower-grid">
        <article className="dashboard-panel capability-panel">
          <header className="panel-heading compact">
            <div>
              <p>03 / CAPABILITY MAP</p>
              <h2>Six selectable foundations.</h2>
            </div>
            <Link href="/dashboard/modules">Inspect modules →</Link>
          </header>
          <div className="capability-table" role="list">
            {capabilityRows.map((capability, index) => (
              <div
                data-tone={capability.tone}
                key={capability.name}
                role="listitem"
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{capability.name}</strong>
                <small>{capability.code}</small>
                <i>SELECTABLE</i>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-panel boundary-panel">
          <header className="panel-heading compact">
            <div>
              <p>04 / OWNERSHIP BOUNDARY</p>
              <h2>Source travels. Customer data does not.</h2>
            </div>
          </header>
          <div className="boundary-copy">
            <span aria-hidden="true">SF</span>
            <p>
              Every generated product owns its credentials, database, domain,
              providers, deployment, backups, alerts, and final launch approval.
            </p>
          </div>
        </article>
      </section>
    </Container>
  );
}
