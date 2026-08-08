import Link from "next/link";
import { productConfig } from "@saasforge/config";
import { Button, Card, Container } from "@saasforge/ui";

const capabilities = [
  {
    eyebrow: "IDENTITY",
    title: "Authentication that is ready for real customers",
    description:
      "Managed sign-in, protected server operations, organizations, roles, and secure account lifecycle flows.",
  },
  {
    eyebrow: "REVENUE",
    title: "Billing separated from product access",
    description:
      "Verified, idempotent webhooks feed a provider-neutral entitlement layer for dependable access decisions.",
  },
  {
    eyebrow: "OPERATIONS",
    title: "Every launch is observable from day one",
    description:
      "Errors, analytics, audit events, health checks, backups, and recovery procedures ship with the product.",
  },
];

const launchItems = [
  "Responsive marketing site",
  "Authenticated application shell",
  "Database and migrations",
  "Payments and entitlements",
  "Transactional email",
  "Analytics and monitoring",
  "Tests and deployment pipeline",
  "Security and privacy controls",
];

function ForgeMark() {
  return (
    <span aria-hidden="true" className="forge-mark">
      SF
    </span>
  );
}

export default function Home() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <Container className="header-inner">
          <Link
            className="brand"
            href="/"
            aria-label={`${productConfig.name} home`}
          >
            <ForgeMark />
            <span>{productConfig.name}</span>
          </Link>
          <nav className="desktop-nav" aria-label="Primary navigation">
            <a href="#platform">Platform</a>
            <a href="#workflow">Workflow</a>
            <a href="#standards">Standards</a>
          </nav>
          <Button asChild size="sm" variant="secondary">
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
        </Container>
      </header>

      <main>
        <section className="hero-section">
          <Container className="hero-grid">
            <div className="hero-copy">
              <div className="status-pill">
                <span className="status-dot" /> Factory foundation online
              </div>
              <h1>
                Turn validated ideas into <span>production SaaS.</span>
              </h1>
              <p className="hero-lede">{productConfig.description}</p>
              <div className="hero-actions">
                <Button asChild size="lg">
                  <Link href="/dashboard">Explore the starter</Link>
                </Button>
                <Button asChild size="lg" variant="ghost">
                  <a href="#platform">Inspect the platform</a>
                </Button>
              </div>
              <div className="hero-proof" aria-label="Platform qualities">
                <span>Strict TypeScript</span>
                <span>Secure defaults</span>
                <span>Independent deployments</span>
              </div>
            </div>

            <div className="forge-console" aria-label="Product launch status">
              <div className="console-topbar">
                <div className="window-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <span>saasforge / launch</span>
                <span className="console-secure">secured</span>
              </div>
              <div className="console-body">
                <p className="console-command">
                  <span>$</span> forge create signaldesk
                </p>
                <div className="console-progress">
                  {launchItems.map((item, index) => (
                    <div className="console-row" key={item}>
                      <span className="console-check">✓</span>
                      <span>{item}</span>
                      <span>{index < 6 ? "ready" : "verified"}</span>
                    </div>
                  ))}
                </div>
                <div className="console-result">
                  <span>LAUNCH READY</span>
                  <strong>02:47</strong>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section className="platform-section" id="platform">
          <Container>
            <div className="section-heading">
              <p>THE PLATFORM</p>
              <h2>The reusable parts are already engineered.</h2>
              <span>
                Products share proven capabilities while keeping their data,
                secrets, and deployments isolated.
              </span>
            </div>
            <div className="capability-grid">
              {capabilities.map((capability, index) => (
                <Card className="capability-card" key={capability.title}>
                  <div className="capability-number">0{index + 1}</div>
                  <p className="capability-eyebrow">{capability.eyebrow}</p>
                  <h3>{capability.title}</h3>
                  <p>{capability.description}</p>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        <section className="workflow-section" id="workflow">
          <Container className="workflow-grid">
            <div className="workflow-copy">
              <p className="section-kicker">THE WORKFLOW</p>
              <h2>Configure the company. Build only the advantage.</h2>
              <p>
                Branding, pricing, limits, providers, and launch content are
                configuration. Your team spends its time on the workflow
                customers will pay for.
              </p>
            </div>
            <ol className="workflow-list">
              <li>
                <span>01</span>
                <div>
                  <strong>Create</strong>
                  <p>
                    Generate an isolated product from the maintained starter.
                  </p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Configure</strong>
                  <p>
                    Set identity, brand, domain, plans, quotas, and enabled
                    modules.
                  </p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Differentiate</strong>
                  <p>Build the smallest valuable customer workflow.</p>
                </div>
              </li>
              <li>
                <span>04</span>
                <div>
                  <strong>Verify & launch</strong>
                  <p>Pass automated gates, deploy, observe, and learn.</p>
                </div>
              </li>
            </ol>
          </Container>
        </section>

        <section className="standards-section" id="standards">
          <Container className="standards-card">
            <div>
              <p className="section-kicker">THE STANDARD</p>
              <h2>Fast enough for experiments. Solid enough for revenue.</h2>
            </div>
            <Button asChild size="lg" variant="dark">
              <Link href="/dashboard">View application shell</Link>
            </Button>
          </Container>
        </section>
      </main>

      <footer>
        <Container className="footer-inner">
          <div className="brand">
            <ForgeMark />
            <span>{productConfig.name}</span>
          </div>
          <p>Built to compound shipping velocity.</p>
        </Container>
      </footer>
    </div>
  );
}
