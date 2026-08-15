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
] as const;

const billingFlow = [
  ["01", "Product pricing", "Owned by the product"],
  ["02", "Billing service", "Server-controlled boundary"],
  ["03", "Stripe adapter", "Provider credentials per product"],
  ["04", "Entitlements", "Internal source of access truth"],
] as const;

const productDecisions = [
  "Plans, prices, currency, and trials",
  "Stripe account and webhook destination",
  "Customer portal and billing support policy",
  "Legal copy, tax posture, and launch approval",
] as const;

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
          <h1>A hardened billing boundary. Waiting for a real product.</h1>
          <span>
            SaaSForge supplies the tested contracts and fail-closed access
            model. A future product supplies the commercial decisions and live
            Stripe configuration.
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
          <div className="module-detail-status">
            <p>PACKAGE STATUS</p>
            <strong>READY</strong>
          </div>
          <h2>Reusable engine validated</h2>
          <span>
            The package, signature verification, reconciliation, and entitlement
            behavior are tested and documented.
          </span>
        </Card>
        <Card className="module-detail-card">
          <div className="module-detail-status">
            <p>LIVE PROVIDER</p>
            <strong>NOT CONNECTED</strong>
          </div>
          <h2>Connected only after validation</h2>
          <span>
            This control center does not carry a shared Stripe account, live
            prices, customer payments, or production webhook destination.
          </span>
        </Card>
      </section>

      <section className="billing-flow" aria-labelledby="billing-flow-title">
        <div className="billing-flow-heading">
          <div>
            <p>CAPABILITY FLOW</p>
            <h2 id="billing-flow-title">
              Provider events become internal access decisions.
            </h2>
          </div>
          <code>stripe → service → entitlement</code>
        </div>
        <ol>
          {billingFlow.map(([number, title, detail]) => (
            <li key={number}>
              <span>{number}</span>
              <strong>{title}</strong>
              <small>{detail}</small>
            </li>
          ))}
        </ol>
      </section>

      <section className="billing-bottom-grid">
        <Card className="safeguard-card">
          <p>BUILT-IN SAFEGUARDS</p>
          <h2>What billing-enabled products inherit</h2>
          <ul>
            {safeguards.map((safeguard) => (
              <li key={safeguard}>{safeguard}</li>
            ))}
          </ul>
        </Card>

        <Card className="billing-decisions-card">
          <p>THE PRODUCT DECIDES</p>
          <h2>Commercial context never becomes a factory default.</h2>
          <ul>
            {productDecisions.map((decision, index) => (
              <li key={decision}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {decision}
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </Container>
  );
}
