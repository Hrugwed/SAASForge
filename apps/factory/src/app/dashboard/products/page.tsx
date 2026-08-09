import Link from "next/link";
import { Button, Card, Container } from "@saasforge/ui";
import { SignOutButton } from "@/components/auth/sign-out-button";
import products from "@/generated/products.json";
import "./products.css";

export const metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

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

      {products.length === 0 ? (
        <Card className="product-registry-empty">
          <span>NO PRODUCTS YET</span>
          <h2>The generator is ready for its first validated idea.</h2>
          <p>
            Creating a product adds it here automatically; credentials and
            customer data never enter the factory registry.
          </p>
        </Card>
      ) : (
        <section
          className="product-registry-grid"
          aria-label="Generated products"
        >
          {products.map((product) => (
            <Card className="product-registry-card" key={product.slug}>
              <div>
                <span>{product.status}</span>
                <small>{product.slug}</small>
              </div>
              <h2>{product.name}</h2>
              <p>{product.description}</p>
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
