import { database } from "@saasforge/database";
import { requireSupportActor } from "@/lib/support-access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const actor = await requireSupportActor();
  if (!actor) return Response.json({ error: "Forbidden" }, { status: 403 });
  const organizationId = new URL(request.url).searchParams.get(
    "organizationId",
  );
  if (!organizationId)
    return Response.json({ error: "Missing organizationId" }, { status: 400 });

  const organization = await database.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      _count: { select: { members: true } },
      subscriptions: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: {
          planKey: true,
          status: true,
          currentPeriodEnd: true,
          lastSyncedAt: true,
        },
      },
    },
  });
  if (!organization)
    return Response.json({ error: "Not found" }, { status: 404 });
  await database.auditEvent.create({
    data: {
      organizationId,
      actorType: "USER",
      actorId: actor.id,
      action: "support.organization.viewed",
      targetType: "organization",
      targetId: organizationId,
    },
  });
  return Response.json(organization, {
    headers: { "Cache-Control": "no-store" },
  });
}
