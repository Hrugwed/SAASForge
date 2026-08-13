import type { Inngest } from "inngest";
import type { JobProvider } from "./index";

type InngestClient = Pick<Inngest, "send">;

export function createInngestJobProvider(client: InngestClient): JobProvider {
  return {
    async send(event) {
      const result = await client.send({
        id: event.idempotencyKey,
        name: event.name,
        data: {
          ...event.data,
          organizationId: event.organizationId,
          ...(event.userId ? { userId: event.userId } : {}),
          occurredAt: event.occurredAt.toISOString(),
        },
      });
      const providerEventId = result.ids[0];
      if (!providerEventId)
        throw new Error("The durable job provider did not accept the event.");
      return { providerEventId, acceptedAt: new Date() };
    },
  };
}
