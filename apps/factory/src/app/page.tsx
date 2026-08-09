import Link from "next/link";
import { Button, Card, Container } from "@saasforge/ui";
import { factoryConfig } from "@/lib/factory-config";

const capabilities = [
  {
    eyebrow: "IDENTITY",
    title: "A protected private control center",
    description:
      "Manage the factory through secure sessions, workspace ownership, and server-enforced permissions.",
  },
  {
    eyebrow: "MODULES",
    title: "Reusable engines, isolated products",
    description:
      "Billing, identity, data, and future services are built once, then configured independently for each product.",
  },
  {
    eyebrow: "OPERATIONS",
    title: "A repeatable path from idea to launch",
    description:
      "Validation, build, launch, measurement, and iteration live in one evolving private operating system.",
  },
];

const launchItems = [
  "Idea validation brief",
  "Product configuration",
  "Identity and tenant model",
  "Billing engine when needed",
  "Landing and application shell",
  "Quality checks and deployment",
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
            aria-label={`${factoryConfig.name} home`}
            className="brand"
            href="/"
          >
            <ForgeMark />
            <span>{factoryConfig.name}</span>
          </Link>
          <nav aria-label="Factory overview" className="desktop-nav">
            <a href="#factory">Factory</a>
            <a href="#workflow">Workflow</a>
            <a href="#standard">Standard</a>
          </nav>
          <Button asChild size="sm" variant="secondary">
            <Link href="/dashboard">Open factory</Link>
          </Button>
        </Container>
      </header>

      <main>
        <section className="hero-section" id="factory">
          <Container className="hero-grid">
            <div className="hero-copy">
              <div className="status-pill">
                <span className="status-dot" /> Private factory online
              </div>
              <h1>
                Build the next product from <span>proven foundations.</span>
              </h1>
              <p className="hero-lede">
                SaaSForge is your internal system for turning validated ideas
                into focused SaaS products—without rebuilding the company each
                time.
              </p>
              <div className="hero-actions">
                <Button asChild size="lg">
                  <Link href="/dashboard">Enter your factory</Link>
                </Button>
                <Button asChild size="lg" variant="ghost">
                  <a href="#workflow">View the workflow</a>
                </Button>
              </div>
              <div className="hero-proof" aria-label="Factory qualities">
                <span>Private by design</span>
                <span>Secure defaults</span>
                <span>Product isolation</span>
              </div>
            </div>

            <div className="forge-console" aria-label="Factory readiness">
              <div className="console-topbar">
                <div aria-hidden="true" className="window-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span>saasforge / product blueprint</span>
                <span className="console-secure">private</span>
              </div>
              <div className="console-body">
                <p className="console-command">
                  <span>$</span> forge plan next-product
                </p>
                <div className="console-progress">
                  {launchItems.map((item, index) => (
                    <div className="console-row" key={item}>
                      <span className="console-check">✓</span>
                      <span>{item}</span>
                      <span>{index < 4 ? "ready" : "next"}</span>
                    </div>
                  ))}
                </div>
                <div className="console-result">
                  <span>FACTORY READY</span>
                  <strong>PRIVATE</strong>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section className="platform-section">
          <Container>
            <div className="section-heading">
              <p>THE FACTORY</p>
              <h2>Built for us first. Reusable for every product after.</h2>
              <span>
                SaaSForge is not a customer-facing SaaS. It is the maintained
                system behind the customer-facing products we choose to launch.
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
              <h2>
                Validate first. Configure the product second. Build the edge
                last.
              </h2>
              <p>
                The factory supplies the repeatable engineering work. Each
                product supplies only the customer problem, its positioning, and
                its differentiated workflow.
              </p>
            </div>
            <ol className="workflow-list">
              <li>
                <span>01</span>
                <div>
                  <strong>Validate</strong>
                  <p>Prove the problem, audience, and willingness to pay.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Configure</strong>
                  <p>
                    Give the product its own brand, data, secrets, domain, and
                    plans.
                  </p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Build the advantage</strong>
                  <p>Ship only the workflow that makes the product valuable.</p>
                </div>
              </li>
              <li>
                <span>04</span>
                <div>
                  <strong>Launch and learn</strong>
                  <p>
                    Measure pull, improve what works, and retire what does not.
                  </p>
                </div>
              </li>
            </ol>
          </Container>
        </section>

        <section className="standards-section" id="standard">
          <Container className="standards-card">
            <div>
              <p className="section-kicker">THE STANDARD</p>
              <h2>Private system. Public products. Clear boundaries.</h2>
            </div>
            <Button asChild size="lg" variant="dark">
              <Link href="/dashboard/modules">Inspect factory modules</Link>
            </Button>
          </Container>
        </section>
      </main>

      <footer>
        <Container className="footer-inner">
          <div className="brand">
            <ForgeMark />
            <span>{factoryConfig.name}</span>
          </div>
          <p>Private infrastructure for focused products.</p>
        </Container>
      </footer>
    </div>
  );
}
