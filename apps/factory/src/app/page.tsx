import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@saasforge/ui";
import { ForgeCore } from "@/components/marketing/forge-core";
import { MobileNavigation } from "@/components/marketing/mobile-navigation";
import { ModuleComposer } from "@/components/marketing/module-composer";
import styles from "./page.module.css";

const pipeline = [
  "setup",
  "doctor",
  "format",
  "lint",
  "types",
  "tests",
  "license",
  "build",
  "browser",
  "security",
] as const;

const supplied = [
  "Standalone repository structure",
  "Selected capability packages",
  "Safe setup and diagnostics",
  "Quality and security workflows",
  "Agent instructions and context routing",
  "Operations and upgrade runbooks",
] as const;

const productOwned = [
  "The customer problem and core workflow",
  "Brand, interface, and positioning",
  "Pricing, legal, and policy decisions",
  "Provider accounts and production secrets",
  "Domain, customer data, and launch approval",
  "Backups, alerts, and incident ownership",
] as const;

export const metadata: Metadata = {
  title: "The AI-native foundation for independent SaaS products",
  description:
    "SaaSForge composes isolated SaaS repositories from validated blueprints, reusable capability contracts, agent-ready context, and executable verification.",
};

function ForgeMark() {
  return (
    <span aria-hidden="true" className={styles.mark}>
      <span>SF</span>
    </span>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className={styles.eyebrow}>
      <span />
      {children}
    </p>
  );
}

function SectionNumber({ children }: { children: ReactNode }) {
  return <span className={styles.sectionNumber}>{children}</span>;
}

export default function Home() {
  return (
    <div className={styles.landing} id="top">
      <a className={styles.skipLink} href="#main-content">
        Skip to content
      </a>

      <header className={styles.header}>
        <Container className={styles.headerInner}>
          <a aria-label="SaaSForge home" className={styles.brand} href="#top">
            <ForgeMark />
            <span>SaaSForge</span>
          </a>

          <nav aria-label="SaaSForge overview" className={styles.desktopNav}>
            <a href="#blueprint">Blueprint</a>
            <a href="#isolation">Isolation</a>
            <a href="#agents">AI native</a>
            <a href="#upgrades">Upgrades</a>
            <a href="#evidence">Evidence</a>
          </nav>

          <div className={styles.headerActions}>
            <Link className={styles.headerCta} href="/dashboard">
              Open factory
              <span aria-hidden="true">↗</span>
            </Link>
            <MobileNavigation className={styles.mobileMenu} />
          </div>
        </Container>
      </header>

      <main id="main-content">
        <section aria-labelledby="hero-title" className={styles.hero}>
          <Container className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <Eyebrow>MIT-LICENSED · AI-NATIVE SAAS FACTORY</Eyebrow>
              <h1 id="hero-title">
                Start with the idea.
                <span>Not the plumbing.</span>
              </h1>
              <p className={styles.heroLead}>
                SaaSForge composes an isolated, agent-readable repository with
                the repeatable SaaS foundation already structured, documented,
                and locally validated.
              </p>
              <div className={styles.heroActions}>
                <a className={styles.primaryCta} href="#blueprint">
                  See what gets forged
                  <span aria-hidden="true">↓</span>
                </a>
                <Link className={styles.secondaryCta} href="/dashboard">
                  Open private factory
                </Link>
              </div>
              <dl className={styles.heroFacts}>
                <div>
                  <dt>OUTPUT</dt>
                  <dd>Standalone repository</dd>
                </div>
                <div>
                  <dt>CAPABILITIES</dt>
                  <dd>6 selectable modules</dd>
                </div>
                <div>
                  <dt>STATUS</dt>
                  <dd>
                    <span /> Locally validated
                  </dd>
                </div>
              </dl>
            </div>
            <ForgeCore />
          </Container>
          <div aria-hidden="true" className={styles.heroMarquee}>
            <span>AUTHENTICATION</span>
            <i />
            <span>BILLING</span>
            <i />
            <span>EMAIL</span>
            <i />
            <span>ANALYTICS</span>
            <i />
            <span>JOBS</span>
            <i />
            <span>STORAGE</span>
          </div>
        </section>

        <section className={styles.introSection}>
          <Container className={styles.introGrid}>
            <SectionNumber>01 / THE PREMISE</SectionNumber>
            <div>
              <Eyebrow>REPEAT THE ADVANTAGE, NOT THE SETUP</Eyebrow>
              <h2>
                Every product is different.
                <span>The foundation should not be.</span>
              </h2>
            </div>
            <p>
              Stop asking an agent to reinvent sessions, subscriptions, delivery
              boundaries, test pipelines, and repository conventions for every
              idea. Compose the known work. Build the part customers can only
              get from you.
            </p>
          </Container>
        </section>

        <section
          aria-labelledby="blueprint-title"
          className={styles.blueprintSection}
          id="blueprint"
        >
          <Container>
            <div className={styles.sectionHeading}>
              <div>
                <SectionNumber>02 / THE BLUEPRINT</SectionNumber>
                <Eyebrow>REAL INPUTS · REAL OUTPUT STRUCTURE</Eyebrow>
                <h2 id="blueprint-title">
                  One blueprint in.
                  <span>A product foundation out.</span>
                </h2>
              </div>
              <p>
                Select only what the product needs. The generator validates the
                blueprint, resolves dependency closure, composes the standalone
                repository, and records what it owns.
              </p>
            </div>
            <ModuleComposer />
          </Container>
        </section>

        <section
          aria-labelledby="isolation-title"
          className={styles.isolationSection}
          id="isolation"
        >
          <Container>
            <div className={styles.sectionHeading}>
              <div>
                <SectionNumber>03 / THE BOUNDARY</SectionNumber>
                <Eyebrow>INDEPENDENT BY DEFAULT</Eyebrow>
                <h2 id="isolation-title">
                  Shared knowledge.
                  <span>Separate blast radius.</span>
                </h2>
              </div>
              <p>
                Products inherit maintained source and operating patterns—not a
                shared production failure domain. Each product owns its runtime
                decisions and customer data.
              </p>
            </div>

            <div className={styles.boundaryDiagram}>
              <div className={styles.factoryNode}>
                <span>FACTORY KNOWLEDGE</span>
                <strong>SaaSForge</strong>
                <small>packages · templates · playbooks</small>
              </div>
              <div aria-hidden="true" className={styles.boundaryLines}>
                <span />
                <span />
                <span />
              </div>
              <div className={styles.productNodes}>
                {["Atlas", "Relay", "Northstar"].map((product, index) => (
                  <article className={styles.productNode} key={product}>
                    <div>
                      <span>PRODUCT 0{index + 1}</span>
                      <strong>{product}</strong>
                    </div>
                    <ul>
                      <li>own repository</li>
                      <li>own database</li>
                      <li>own providers</li>
                      <li>own deployment</li>
                    </ul>
                  </article>
                ))}
              </div>
              <p className={styles.boundaryNote}>
                Source travels. Customer data does not.
              </p>
            </div>
          </Container>
        </section>

        <section
          aria-labelledby="agents-title"
          className={styles.agentSection}
          id="agents"
        >
          <Container className={styles.agentGrid}>
            <div className={styles.agentCopy}>
              <SectionNumber>04 / AGENT CONTEXT</SectionNumber>
              <Eyebrow>PROGRESSIVE CONTEXT DISCLOSURE</Eyebrow>
              <h2 id="agents-title">
                Agents get a map.
                <span>Not the whole warehouse.</span>
              </h2>
              <p>
                Root instructions route Codex and Claude into the smallest
                relevant documentation, package boundary, and executable
                verification workflow.
              </p>
              <div className={styles.contextRoute}>
                {[
                  "AGENTS.md",
                  "context-map.md",
                  "docs/billing.md",
                  "packages/billing",
                  "pnpm test",
                ].map((item, index) => (
                  <div key={item}>
                    <span>0{index + 1}</span>
                    <strong>{item}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.agentTerminal}>
              <div className={styles.terminalBar}>
                <span>agent / scoped task</span>
                <span className={styles.liveBadge}>context routed</span>
              </div>
              <div className={styles.terminalBody}>
                <p>
                  <span>→</span> Read repository instructions
                </p>
                <p>
                  <span>→</span> Route: payments or access
                </p>
                <p className={styles.terminalDim}>
                  docs/billing.md → packages/billing
                </p>
                <p>
                  <span>→</span> Inspect stable capability contract
                </p>
                <div className={styles.codeBlock}>
                  <span>const</span> access = await entitlements.resolve(
                  <br />
                  &nbsp;&nbsp;organizationId,
                  <br />
                  &nbsp;&nbsp;planKey,
                  <br />
                  );
                </div>
                <p>
                  <span>→</span> Run affected verification
                </p>
                <p className={styles.terminalSuccess}>
                  ✓ billing tests passed · 11 / 11
                </p>
              </div>
            </div>
          </Container>
        </section>

        <section
          aria-labelledby="upgrades-title"
          className={styles.upgradeSection}
          id="upgrades"
        >
          <Container>
            <div className={styles.sectionHeading}>
              <div>
                <SectionNumber>05 / SAFE EVOLUTION</SectionNumber>
                <Eyebrow>THREE-WAY PRODUCT UPGRADES</Eyebrow>
                <h2 id="upgrades-title">
                  Improve the factory.
                  <span>Keep the product yours.</span>
                </h2>
              </div>
              <p>
                A dry-run-first upgrade compares the original generated file,
                the customized product, and the new factory output before
                writing anything.
              </p>
            </div>

            <div className={styles.upgradeWorkbench}>
              <div className={styles.diffColumns}>
                <article>
                  <span>BASE / v0.1</span>
                  <strong>Original factory</strong>
                  <code>apps/web/page.tsx</code>
                  <small>hash: 77a1…f29c</small>
                </article>
                <article>
                  <span>PRODUCT / CURRENT</span>
                  <strong>Your customization</strong>
                  <code>+ product-specific workflow</code>
                  <small className={styles.preserved}>preserve</small>
                </article>
                <article>
                  <span>TARGET / v0.2</span>
                  <strong>New factory</strong>
                  <code>+ safer capability boundary</code>
                  <small className={styles.updated}>review</small>
                </article>
              </div>
              <div className={styles.upgradePlan}>
                <div>
                  <span>DRY-RUN PLAN</span>
                  <strong>Product changes stay visible.</strong>
                </div>
                <ul>
                  <li data-state="updated">01 updated</li>
                  <li data-state="preserved">02 preserved</li>
                  <li data-state="conflict">00 conflicts</li>
                </ul>
                <div className={styles.testStamp}>
                  <strong>26</strong>
                  <span>FORGE CLI TESTS</span>
                  <small>validated 14 AUG 2026</small>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section
          aria-labelledby="evidence-title"
          className={styles.evidenceSection}
          id="evidence"
        >
          <Container>
            <div className={styles.sectionHeading}>
              <div>
                <SectionNumber>06 / EXECUTABLE CONFIDENCE</SectionNumber>
                <Eyebrow>VERIFICATION OVER VIBES</Eyebrow>
                <h2 id="evidence-title">
                  Confidence is a command.
                  <span>Not a dashboard badge.</span>
                </h2>
              </div>
              <p>
                The repository carries repeatable checks and dated local
                evidence. Production approval still belongs to each product and
                its real providers.
              </p>
            </div>

            <ol
              aria-label="Repository verification pipeline"
              className={styles.pipeline}
            >
              {pipeline.map((step, index) => (
                <li key={step}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{step}</strong>
                  <i aria-hidden="true" />
                </li>
              ))}
            </ol>

            <div className={styles.evidenceLedger}>
              <article>
                <span>GENERATED PROFILE</span>
                <strong>170</strong>
                <p>managed files in the full local validation profile</p>
              </article>
              <article>
                <span>DATABASE HISTORY</span>
                <strong>03</strong>
                <p>generated migrations in the full capability profile</p>
              </article>
              <article>
                <span>BROWSER JOURNEYS</span>
                <strong>02</strong>
                <p>desktop and mobile factory journeys in the quality gate</p>
              </article>
              <article className={styles.ledgerStatement}>
                <span>STATUS LANGUAGE</span>
                <strong>Locally validated.</strong>
                <p>
                  Not marketed as production-ready before deployment, provider,
                  recovery, and launch evidence exists.
                </p>
              </article>
            </div>
          </Container>
        </section>

        <section
          aria-labelledby="ownership-title"
          className={styles.ownershipSection}
        >
          <Container>
            <div className={styles.ownershipHeading}>
              <SectionNumber>07 / THE HONEST BOUNDARY</SectionNumber>
              <h2 id="ownership-title">
                We supply the foundation.
                <span>You supply the reason to exist.</span>
              </h2>
            </div>
            <div className={styles.ownershipGrid}>
              <article>
                <div>
                  <span>SAASFORGE SUPPLIES</span>
                  <strong>The repeatable engineering</strong>
                </div>
                <ul>
                  {supplied.map((item) => (
                    <li key={item}>
                      <span aria-hidden="true">+</span> {item}
                    </li>
                  ))}
                </ul>
              </article>
              <article>
                <div>
                  <span>THE PRODUCT OWNS</span>
                  <strong>The customer advantage</strong>
                </div>
                <ul>
                  {productOwned.map((item) => (
                    <li key={item}>
                      <span aria-hidden="true">→</span> {item}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </Container>
        </section>

        <section className={styles.finalSection}>
          <Container className={styles.finalInner}>
            <div className={styles.finalOrb} aria-hidden="true">
              <ForgeMark />
            </div>
            <Eyebrow>THE FACTORY IS THE STARTING LINE</Eyebrow>
            <h2>
              Clone the foundation.
              <span>Build the edge.</span>
            </h2>
            <p>
              SaaSForge is MIT licensed. Generated products remain independently
              owned, independently deployed, and deliberately yours.
            </p>
            <div className={styles.finalActions}>
              <Link className={styles.primaryCta} href="/dashboard">
                Open private factory
                <span aria-hidden="true">↗</span>
              </Link>
              <a className={styles.secondaryCta} href="#top">
                Return to top
              </a>
            </div>
            <code>pnpm forge:create -- --name &quot;Next Product&quot;</code>
          </Container>
        </section>
      </main>

      <footer className={styles.footer}>
        <Container className={styles.footerInner}>
          <a aria-label="SaaSForge home" className={styles.brand} href="#top">
            <ForgeMark />
            <span>SaaSForge</span>
          </a>
          <p>AI-native foundations for independent SaaS products.</p>
          <div>
            <span>MIT LICENSED</span>
            <span>FACTORY v0.2</span>
          </div>
        </Container>
      </footer>
    </div>
  );
}
