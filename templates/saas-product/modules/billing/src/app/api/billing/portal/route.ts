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
    const url = await getBillingService().createPortal({
      organizationId: actor.membership.organizationId,
      userId: actor.session.user.id,
    });
    return Response.json({ url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
