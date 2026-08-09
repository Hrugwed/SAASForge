# Stripe billing

SaaSForge keeps Stripe behind `@saasforge/billing`. The package is a reusable engine; the private SaaSForge control center never sells plans or accepts payments. A generated product owns its catalog, Stripe account, checkout routes, and customer-facing pricing. Product code submits an internal plan key, Stripe hosts payment details, and signed webhooks synchronize a normalized subscription and internal entitlements. The browser never supplies a Stripe Price ID, amount, workspace identity, role, or redirect URL.

## Sandbox setup

1. For a specific generated product, decide its positioning and price after validation. In that product's Stripe test mode, create its Product and recurring Price.
2. Copy the product template environment values into that product's ignored `.env.local` file. Set `STRIPE_SECRET_KEY` to the test secret key and use the product's `price_...` identifier. Never paste secrets into source control, tickets, or chat.
3. Install and authenticate the Stripe CLI, then forward sandbox events:

   ```bash
   stripe listen --forward-to <product-local-url>/api/billing/webhook
   ```

4. Set `STRIPE_WEBHOOK_SECRET` to the `whsec_...` signing secret printed by that CLI session, restart `pnpm dev`, and complete a Checkout with a Stripe test card.
5. Configure the Stripe customer portal in test mode so customers can update payment methods and cancel subscriptions.

The CLI signing secret is specific to the local listener. Do not reuse it for the production webhook endpoint.

## Webhook events

Subscribe each product's production endpoint `/api/billing/webhook` to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.paused`
- `customer.subscription.resumed`
- `invoice.paid`
- `invoice.payment_failed`

The route verifies `Stripe-Signature` against the exact raw body, caps request size, records a payload hash, and processes each Stripe event ID once. Failed or abandoned claims can be retried. Because Stripe does not guarantee event order, synchronization retrieves the current Subscription from Stripe before writing local state.

## Access rules

- `trialing` and `active` subscriptions receive the configured entitlements.
- `past_due` receives a three-day grace period, bounded from the current billing-period end.
- Terminal, paused, unpaid, incomplete, unknown-price, and unrecognized states receive no entitlement access.
- Only a workspace owner can create Checkout or portal sessions.
- Provider payment data is not stored in the application database.

Each product defines its own plans, public copy, and entitlement map together. The private factory does not prescribe a default price, currency, or quota.

## Production checklist

1. Create separate live-mode Product and Price objects; do not copy test identifiers.
2. Configure the hosted customer portal and its allowed changes.
3. Create an HTTPS webhook endpoint in Stripe Workbench and copy that endpoint's unique signing secret into the production environment only.
4. Put secrets in the deployment provider's encrypted environment storage. Keep production credentials out of preview deployments.
5. Exercise successful payment, failed renewal, cancellation-at-period-end, cancellation, duplicate delivery, and invalid-signature cases before launch.
6. Monitor failed webhook deliveries and audit `processed_webhook` failures. Add scheduled reconciliation before billing volume makes missed events operationally significant.
