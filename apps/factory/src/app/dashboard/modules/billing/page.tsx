import Link from "next/link";
import { Button, Card, Container } from "@saasforge/ui";
import { SignOutButton } from "@/components/auth/sign-out-button";
import "../modules.css";

const safeguards = [
  "Server-owned plan and Price mapping",
  "Exact raw-body Stripe signature verification",
  "Idempotent webhook delivery records",
  "Internal, fail-closed entitlements",
  "Tenant ownership and role checks",
];

export const metadata = {
  title: "Billing module",
  robots: { index: false, follow: false },
};

export default function BillingModulePage() {
  return (
    <Container className="dashboard-container modules-container">
      <header className="dashboard-header">
        <div>
          <p>REUSABLE REVENUE ENGINE</p>
          <h1>Billing is ready for a product, not for SaaSForge.</h1>
          <span>
            This private factory never sells itself. A future product chooses
            its own plans, Stripe account, prices, domain, and customer portal.
          </span>
        </div>
        <div className="dashboard-actions">
          <Button asChild variant="secondary">
            <Link href="/dashboard/modules">Back to modules</Link>
          </Button>
          <SignOutButton />
        </div>
      </header>

      <section className="module-detail-grid">
        <Card className="module-detail-card ready-card">
          <p>MODULE STATUS</p>
          <h2>Engine complete</h2>
          <span>
            The reusable package is tested and documented. It is intentionally
            disconnected from this private factory dashboard.
          </span>
        </Card>
        <Card className="module-detail-card">
          <p>PER-PRODUCT DECISIONS</p>
          <h2>Chosen only after validation</h2>
          <span>
            Product name, pricing, currency, trial policy, limits, Stripe
            account, legal pages, and customer-facing copy stay outside the
            factory.
          </span>
        </Card>
      </section>

      <Card className="safeguard-card">
        <p>BUILT-IN SAFEGUARDS</p>
        <h2>What every product inherits when billing is enabled</h2>
        <ul>
          {safeguards.map((safeguard) => (
            <li key={safeguard}>{safeguard}</li>
          ))}
        </ul>
      </Card>
    </Container>
  );
}
