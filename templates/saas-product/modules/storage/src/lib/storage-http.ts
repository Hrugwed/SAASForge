import "server-only";

import { RequestOriginError } from "./request-security";

export function storageErrorResponse(error: unknown): Response {
  if (error instanceof RequestOriginError) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (error instanceof SyntaxError) {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (
    error instanceof Error &&
    (error.name === "ZodError" ||
      /not allowed|size limit|Invalid/.test(error.message))
  ) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  console.error("Storage request failed", error);
  return Response.json(
    { error: "Storage is temporarily unavailable." },
    { status: 500 },
  );
}
