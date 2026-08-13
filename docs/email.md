# Transactional email

Generated products use a product-owned Resend account and domain. The email package validates message bounds, requires a stable idempotency key, and retries transient API rejection up to three times with the same key. Permanent rejection fails immediately. Logs include provider message ID, attempt count, and safe categorical tags, never recipient addresses or message bodies.

API acceptance is not inbox delivery. Before launch:

1. Verify a dedicated sending subdomain and complete its SPF, DKIM, and DMARC records.
2. Use a product-owned `RESEND_API_KEY` and a verified `EMAIL_FROM`; Preview and production credentials remain separate.
3. Register a signed Resend webhook or approved webhook ingester for `email.delivered`, `email.delivery_delayed`, `email.failed`, `email.bounced`, `email.complained`, and `email.suppressed`.
4. Deduplicate webhook deliveries by `svix-id`, retain only the event fields needed by the product, and alert on failures, delays, bounce rate, and complaints.
5. Exercise verification, password reset, invitation, email change, deletion confirmation, bounce, complaint, suppression, transient rejection, and provider outage flows.

Resend's dashboard remains the provider evidence and replay surface. The product must define an owner and response playbook for deliverability alerts. Marketing email needs separate consent, unsubscribe, and suppression handling; the transactional service is not permission to send campaigns.
