import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Card, Container } from "@saasforge/ui";
import { CopyCommand } from "@/components/factory/copy-command";
import { getControlPlaneProduct } from "@/lib/control-plane";
import "../products.css";

export const metadata = {
  title: "Product inspection",
  robots: { index: false, follow: false },
};

export default async function ProductInspectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getControlPlaneProduct(slug);
  if (!product) notFound();

  const commands = [
    {
      label: "DIAGNOSE PRODUCT",
      command: `pnpm --dir products/${product.slug} product:doctor`,
    },
    {
      label: "INSPECT MANAGED CHANGES",
      command: `pnpm --dir products/${product.slug} product:changes`,
    },
    {
      label: "RUN PRODUCT TESTS",
      command: `pnpm --dir products/${product.slug} test`,
    },
    {
      label: "BUILD PRODUCT",
      command: `pnpm --dir products/${product.slug} build`,
    },
  ];

  return (
    <Container className="dashboard-container products-container product-detail-container">
      <header className="dashboard-header">
        <div>
          <p>
            PRODUCT INSPECTION / {product.slug.toUpperCase()} ·{" "}
            {product.identitySource === "manifest-verified"
              ? "MANIFEST VERIFIED"
              : "REGISTRY-REPORTED / UNVERIFIED"}
          </p>
          <h1>{product.name}</h1>
          <span>{product.description}</span>
        </div>
        <div className="dashboard-actions">
          <Button asChild variant="secondary">
            <Link href="/dashboard/products">Back to products</Link>
          </Button>
        </div>
      </header>

      <section className="product-detail-metrics" aria-label="Product evidence">
        <Card>
          <span>EVIDENCE STATE</span>
          <strong>{product.evidenceState.replaceAll("-", " ")}</strong>
          <small>{product.inspectionMessage}</small>
        </Card>
        <Card>
          <span>FACTORY LINEAGE</span>
          <strong>{product.generatedWith ?? "Unknown"}</strong>
          <small>Current factory: {product.currentFactoryVersion}</small>
        </Card>
        <Card>
          <span>MANAGED SOURCE</span>
          <strong>{product.managedFileCount ?? "—"}</strong>
          <small>Fingerprints remain server-side</small>
        </Card>
        <Card>
          <span>CAPABILITIES</span>
          <strong>{product.modules.length}</strong>
          <small>
            {product.modules.length === 0
              ? "Base foundation only"
              : product.modules.join(" · ")}
          </small>
        </Card>
      </section>

      <section className="product-detail-grid">
        <Card className="product-detail-panel">
          <header>
            <div>
              <span>01 / REPOSITORY EVIDENCE</span>
              <h2>Expected artifacts</h2>
            </div>
            <i data-state={product.inspectionCode}>
              {product.inspectionCode.replaceAll("-", " ")}
            </i>
          </header>
          <ul className="product-artifact-list">
            {product.artifacts.map((artifact, index) => (
              <li key={artifact.key}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{artifact.label}</strong>
                <i data-state={artifact.state}>{artifact.state}</i>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="product-detail-panel product-signal-panel">
          <header>
            <div>
              <span>02 / PRODUCT-OWNED SIGNALS</span>
              <h2>Provider boundaries</h2>
            </div>
          </header>
          <div className="product-signal-grid">
            {product.signals.map((signal) => (
              <div key={signal.key}>
                <span>{signal.label}</span>
                <strong>{signal.provider}</strong>
                <small>{signal.state.replaceAll("-", " ")}</small>
              </div>
            ))}
          </div>
          <p>
            Live analytics, revenue, errors, and deployment data appear only
            after this product explicitly connects its own read-only provider
            adapters. No credentials are read from the product repository.
          </p>
        </Card>
      </section>

      <Card className="product-commands-panel">
        <header>
          <div>
            <span>03 / SAFE OPERATOR COMMANDS</span>
            <h2>Run intentionally from the factory terminal.</h2>
          </div>
          <small>
            {product.inspectionCode === "verified"
              ? "COPY ONLY · NEVER EXECUTED BY THE DASHBOARD"
              : "LOCKED UNTIL REPOSITORY EVIDENCE VERIFIES"}
          </small>
        </header>
        {product.inspectionCode === "verified" ? (
          <>
            <p className="product-command-prerequisite">
              Prerequisite: run these from a trusted checkout of this factory;
              the dashboard only copies text and never executes a command.
            </p>
            <div className="product-command-list">
              {commands.map((command) => (
                <CopyCommand key={command.label} {...command} />
              ))}
            </div>
          </>
        ) : (
          <p className="product-command-unavailable">
            Commands remain hidden because the product path, manifest identity,
            or expected artifacts have not fully verified. Resolve the evidence
            state first, then refresh this page.
          </p>
        )}
      </Card>
    </Container>
  );
}
