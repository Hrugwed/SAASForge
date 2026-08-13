import "server-only";
import { createJobs } from "@saasforge/jobs";
import { createInngestJobProvider } from "@saasforge/jobs/server";
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "__PRODUCT_SLUG__",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

export const jobs = createJobs(createInngestJobProvider(inngest));
