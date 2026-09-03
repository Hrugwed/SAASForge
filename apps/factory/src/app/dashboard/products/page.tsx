import Link from "next/link";
import { Button, Card, Container } from "@saasforge/ui";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { BlueprintComposer } from "@/components/factory/blueprint-composer";
import { getControlPlaneSnapshot } from "@/lib/control-plane";
import "./products.css";

export const metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

const generationSteps = [
  {
    number: "01",
    title: "Describe the product",
    detail: "Name the outcome and select only the capabilities it needs.",
  },
  {
    number: "02",
    title: "Compose the repository",
    detail: "The factory resolves dependencies and records managed files.",
  },
  {
    number: "03",
    title: "Inspect the evidence",
    detail: "The control plane reconciles the registry and product manifest.",
  },
] as const;

const ownershipBoundaries = [
  ["REPOSITORY", "Independent"],
  ["DATABASE", "Product-owned"],
  ["PROVIDERS", "Product-owned"],
  ["DEPLOYMENT", "Product-owned"],
] as const;

export default async function ProductsPage() {
  const snapshot = await getControlPlaneSnapshot();

  return (
    <Container className="dashboard-container products-container">
      <header className="dashboard-header">
        <div>
          <p>FRESH PRODUCT REGISTRY READ</p>
          <h1>Independent products, reconciled locally.</h1>
          <span>
            Each record is validated against its generated manifest and expected
            repository artifacts. Runtime and production evidence remain
            product-owned.
          </span>
        </div>
        <div className="dashboard-actions">
          <Button asChild variant="secondary">
            <Link href="/dashboard">Command center</Link>
          </Button>
          <SignOutButton />
        </div>
      </header>

      {snapshot.issues.length > 0 ? (
        <section
          className="registry-issues"
          aria-labelledby="registry-issues-title"
        >
          <div>
            <span>REGISTRY ATTENTION</span>
            <h2 id="registry-issues-title">
              {snapshot.issues.length} bounded registry issue
              {snapshot.issues.length === 1 ? "" : "s"}
            </h2>
          </div>
          <ul>
            {snapshot.issues.map((issue, index) => (
              <li key={`${issue.code}-${index}`}>
                <strong>{issue.code.replaceAll("-", " ")}</strong>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <BlueprintComposer />

      {snapshot.products.length === 0 ? (
        <section
          aria-labelledby="first-product-title"
          className="product-empty-workspace"
        >
          <Card className="product-registry-empty">
            <div className="product-empty-copy">
              <span>GENERATOR STANDING BY</span>
              <h2 id="first-product-title">
                Forge the first standalone product.
              </h2>
              <p>
                Start after the idea is validated. SaaSForge composes the
                repeatable foundation; the product still owns its customer
                workflow, brand, providers, and launch decision.
              </p>

              <ol className="product-generation-steps">
                {generationSteps.map((step) => (
                  <li key={step.number}>
                    <span>{step.number}</span>
                    <div>
                      <strong>{step.title}</strong>
                      <p>{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="product-empty-actions">
                <Button asChild>
                  <Link href="#blueprint-composer">Compose blueprint</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/dashboard/modules">Inspect capabilities</Link>
                </Button>
              </div>
            </div>

            <section
              aria-label="Generated repository preview"
              className="product-terminal"
            >
              <div className="product-terminal-bar">
                <span aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span>NEXT-PRODUCT / OUTPUT</span>
                <strong>STANDALONE</strong>
              </div>
              <div className="product-terminal-body">
                <p>
                  <span>◇</span> next-product/
                </p>
                <ul>
                  <li>
                    <span>└</span> apps/web/
                  </li>
                  <li>
                    <span>└</span> packages/
                  </li>
                  <li>
                    <span>·</span> docs/
                  </li>
                  <li>
                    <span>·</span> scripts/
                  </li>
                  <li>
                    <span>·</span> AGENTS.md
                  </li>
                  <li>
                    <span>·</span> saasforge.manifest.json
                  </li>
                </ul>
              </div>
              <div className="product-terminal-status">
                <span aria-hidden="true" />
                blueprint → dependency closure → repository
              </div>
            </section>
          </Card>

          <div className="product-boundaries" aria-label="Product ownership">
            {ownershipBoundaries.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section
          className="product-registry-grid"
          aria-label="Generated products"
        >
          {snapshot.products.map((product, index) => {
            const presentArtifacts = product.artifacts.filter(
              (artifact) => artifact.state === "present",
            ).length;
            return (
              <Card className="product-registry-card" key={product.slug}>
                <div className="product-card-status">
                  <span>{String(index + 1).padStart(2, "0")} / PRODUCT</span>
                  <small data-state={product.evidenceState}>
                    {product.identitySource === "manifest-verified"
                      ? product.evidenceState.replaceAll("-", " ")
                      : "registry-reported · unverified"}
                  </small>
                </div>
                <h2>{product.name}</h2>
                <p>{product.description}</p>
                <dl className="product-evidence-grid">
                  <div>
                    <dt>GENERATED WITH</dt>
                    <dd>{product.generatedWith ?? "Unknown"}</dd>
                  </div>
                  <div>
                    <dt>FACTORY NOW</dt>
                    <dd>{product.currentFactoryVersion}</dd>
                  </div>
                  <div>
                    <dt>MANAGED FILES</dt>
                    <dd>{product.managedFileCount ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>ARTIFACTS</dt>
                    <dd>
                      {presentArtifacts}/{product.artifacts.length}
                    </dd>
                  </div>
                </dl>
                <ul className="product-module-list">
                  {product.modules.length === 0 ? <li>base only</li> : null}
                  {product.modules.map((moduleName) => (
                    <li key={moduleName}>{moduleName}</li>
                  ))}
                </ul>
                <footer className="product-card-footer">
                  <span>{product.inspectionMessage}</span>
                  <Link href={`/dashboard/products/${product.slug}`}>
                    Inspect product →
                  </Link>
                </footer>
              </Card>
            );
          })}
        </section>
      )}
    </Container>
  );
}
