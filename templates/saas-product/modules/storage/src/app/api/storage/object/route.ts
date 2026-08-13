import { assertTrustedOrigin } from "@/lib/request-security";
import { objectRequestSchema } from "@saasforge/storage";
import { getStorage } from "@/lib/storage";
import { getStorageActor } from "@/lib/storage-access";
import { storageErrorResponse } from "@/lib/storage-http";

async function actorOrganization() {
  const actor = await getStorageActor();
  if (actor.status !== "authorized") return actor;
  return { status: "authorized" as const, id: actor.membership.organizationId };
}

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const actor = await actorOrganization();
    if (actor.status === "unauthenticated")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (actor.status === "forbidden")
      return Response.json({ error: "Forbidden" }, { status: 403 });
    const body = objectRequestSchema
      .omit({ organizationId: true })
      .parse(await request.json());
    const result = await getStorage().createDownload({
      organizationId: actor.id,
      ...body,
    });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return storageErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertTrustedOrigin(request);
    const actor = await actorOrganization();
    if (actor.status === "unauthenticated")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (actor.status === "forbidden")
      return Response.json({ error: "Forbidden" }, { status: 403 });
    const body = objectRequestSchema
      .pick({ key: true })
      .parse(await request.json());
    await getStorage().delete({ organizationId: actor.id, ...body });
    return new Response(null, { status: 204 });
  } catch (error) {
    return storageErrorResponse(error);
  }
}
