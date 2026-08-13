import { getBillingService } from "@/lib/billing-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return Boolean(
    secret && request.headers.get("authorization") === `Bearer ${secret}`,
  );
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getBillingService().reconcileSubscriptions();
  return Response.json(result, {
    status: result.failed > 0 ? 503 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
