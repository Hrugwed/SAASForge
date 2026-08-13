import { assertTrustedOrigin } from "@/lib/request-security";
import { uploadRequestSchema } from "@saasforge/storage";
import { getStorage } from "@/lib/storage";
import { getStorageActor } from "@/lib/storage-access";
import { storageErrorResponse } from "@/lib/storage-http";

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const actor = await getStorageActor();
    if (actor.status === "unauthenticated")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (actor.status === "forbidden")
      return Response.json({ error: "Forbidden" }, { status: 403 });
    const body = uploadRequestSchema
      .omit({ organizationId: true })
      .parse(await request.json());
    const result = await getStorage().createUpload({
      organizationId: actor.membership.organizationId,
      ...body,
    });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return storageErrorResponse(error);
  }
}
