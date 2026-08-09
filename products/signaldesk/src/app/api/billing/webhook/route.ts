import { BillingConfigurationError } from "@saasforge/billing/server";
import { getBillingService } from "@/lib/billing-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const maximumWebhookBytes = 1_048_576;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maximumWebhookBytes)
    return Response.json({ error: "Payload too large" }, { status: 413 });
  const signature = request.headers.get("stripe-signature");
  if (!signature)
    return Response.json(
      { error: "Missing Stripe signature" },
      { status: 400 },
    );
  const payload = await request.text();
  if (Buffer.byteLength(payload, "utf8") > maximumWebhookBytes)
    return Response.json({ error: "Payload too large" }, { status: 413 });
  try {
    const result = await getBillingService().processWebhook({
      payload,
      signature,
    });
    return Response.json(
      { received: true, ...result },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "StripeSignatureVerificationError"
    )
      return Response.json(
        { error: "Invalid Stripe signature" },
        { status: 400 },
      );
    if (error instanceof BillingConfigurationError)
      return Response.json(
        { error: "Stripe webhook is not configured" },
        { status: 503 },
      );
    console.error("Stripe webhook processing failed", error);
    return Response.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
