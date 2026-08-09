import { checkoutRequestSchema } from "@saasforge/billing";
import { getBillingActor } from "@/lib/billing-access";
import { billingErrorResponse } from "@/lib/billing-http";
import { getBillingService } from "@/lib/billing-service";
import { assertTrustedOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const actor = await getBillingActor();
    if (actor.status === "unauthenticated")
      return Response.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    if (actor.status === "forbidden")
      return Response.json({ error: "Owner access required" }, { status: 403 });
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 2_048)
      return Response.json({ error: "Request is too large" }, { status: 413 });
    const parsed = checkoutRequestSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success)
      return Response.json({ error: "Invalid billing plan" }, { status: 400 });
    const url = await getBillingService().createCheckout({
      organizationId: actor.membership.organizationId,
      planKey: parsed.data.planKey,
      userEmail: actor.session.user.email,
      userId: actor.session.user.id,
    });
    return Response.json({ url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
