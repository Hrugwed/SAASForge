import { hasOrganizationPermission } from "@saasforge/auth";
import { database } from "@saasforge/database";
import { BillingActionButton } from "@/components/billing/billing-action-button";
import { billingCatalog, billingConfigured } from "@/lib/billing-config";
import { getPrimaryMembership } from "@/lib/organization";
import { requireSession } from "@/lib/session";
import "./billing.css";

export const metadata = {
  title: "Billing",
  robots: { index: false, follow: false },
};

export default async function BillingPage() {
  const session = await requireSession();
  const membership = await getPrimaryMembership(session.user.id);
  const subscription = membership
    ? await database.subscription.findFirst({
        where: {
          organizationId: membership.organizationId,
          provider: "STRIPE",
        },
        orderBy: { updatedAt: "desc" },
      })
    : null;
  const canManage = Boolean(
    membership && hasOrganizationPermission(membership.role, "billing:manage"),
  );
  const plan = billingCatalog.plans[0];
  return (
    <div className="product-billing-page">
      <header>
        <p>PRODUCT BILLING</p>
        <h1>Plans and access</h1>
        <span>
          Stripe handles payment details; signed events control internal access.
        </span>
      </header>
      {!billingConfigured ? (
        <div className="billing-setup">
          <strong>Sandbox configuration required</strong>
          <span>
            Add this product’s Stripe secret, webhook secret, and Price ID to
            its ignored environment.
          </span>
        </div>
      ) : null}
      <section>
        <article>
          <p>CURRENT ACCESS</p>
          <h2>{subscription?.planKey ?? "Free"}</h2>
          <strong>{subscription?.status ?? "NO SUBSCRIPTION"}</strong>
          {subscription?.providerCustomerId && canManage ? (
            <BillingActionButton
              action="portal"
              disabled={!billingConfigured}
            />
          ) : null}
        </article>
        {plan ? (
          <article className="billing-plan">
            <p>PRODUCT PLAN</p>
            <h2>{plan.name}</h2>
            <strong>{plan.priceLabel}</strong>
            <p>{plan.description}</p>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <BillingActionButton
              action="checkout"
              disabled={
                !billingConfigured ||
                !canManage ||
                Boolean(subscription && subscription.status !== "CANCELED")
              }
              planKey={plan.key}
            />
          </article>
        ) : null}
      </section>
    </div>
  );
}
