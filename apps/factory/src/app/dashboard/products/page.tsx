import Link from "next/link";
import { Button, Card, Container } from "@saasforge/ui";
import { SignOutButton } from "@/components/auth/sign-out-button";
import products from "@/generated/products.json";
import "./products.css";

type ProductRegistryItem = {
  name: string;
  slug: string;
  description: string;
  modules: string[];
  createdAt: string;
  status: string;
};

const productRegistry: ProductRegistryItem[] = products;

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
    title: "Prove the foundation",
    detail: "Run setup, diagnostics, quality checks, and browser journeys.",
  },
] as const;

const ownershipBoundaries = [
  ["REPOSITORY", "Independent"],
  ["DATABASE", "Product-owned"],
  ["PROVIDERS", "Product-owned"],
  ["DEPLOYMENT", "Product-owned"],
] as const;

export default function ProductsPage() {
  return (
    <Container className="dashboard-container products-container">
      <header className="dashboard-header">
        <div>
          <p>PRODUCT REGISTRY</p>
          <h1>Independent products, one maintained factory.</h1>
          <span>
            Generated products share source packages while owning their design,
            secrets, database, billing configuration, and deployment.
          </span>
        </div>
        <div className="dashboard-actions">
          <Button asChild variant="secondary">
            <Link href="/dashboard">Command center</Link>
          </Button>
          <SignOutButton />
        </div>
      </header>

      {productRegistry.length === 0 ? (
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
                Start after the idea is validated. SaaSForge will compose the
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
                  <Link href="/dashboard/modules">Inspect capabilities</Link>
                </Button>
                <code>
                  pnpm forge:create -- --name &quot;Next Product&quot;
                </code>
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
          {productRegistry.map((product, index) => (
            <Card className="product-registry-card" key={product.slug}>
              <div>
                <span>{String(index + 1).padStart(2, "0")} / PRODUCT</span>
                <small>{product.status}</small>
              </div>
              <h2>{product.name}</h2>
              <p>{product.description}</p>
              <code>{product.slug}/</code>
              <ul>
                {product.modules.map((moduleName) => (
                  <li key={moduleName}>{moduleName}</li>
                ))}
              </ul>
            </Card>
          ))}
        </section>
      )}
    </Container>
  );
}
