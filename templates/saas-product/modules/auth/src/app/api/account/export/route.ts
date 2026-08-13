import { database } from "@saasforge/database";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await database.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      members: {
        select: {
          role: true,
          createdAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              createdAt: true,
              subscriptions: {
                select: {
                  planKey: true,
                  status: true,
                  currentPeriodStart: true,
                  currentPeriodEnd: true,
                  cancelAtPeriodEnd: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
              entitlements: {
                select: {
                  key: true,
                  value: true,
                  enabled: true,
                  expiresAt: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
        },
      },
    },
  });
  if (!user) return Response.json({ error: "Not found" }, { status: 404 });

  const auditEvents = await database.auditEvent.findMany({
    where: { actorId: session.user.id },
    orderBy: { occurredAt: "asc" },
    select: {
      action: true,
      targetType: true,
      targetId: true,
      metadata: true,
      occurredAt: true,
    },
  });
  await database.auditEvent.create({
    data: {
      actorType: "USER",
      actorId: session.user.id,
      action: "privacy.export.created",
      targetType: "user",
      targetId: session.user.id,
    },
  });

  return new Response(
    JSON.stringify(
      { exportedAt: new Date().toISOString(), user, auditEvents },
      null,
      2,
    ),
    {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="account-export-${session.user.id}.json"`,
        "Content-Type": "application/json; charset=utf-8",
      },
    },
  );
}
