import type { Config, Context } from "@netlify/functions";
import { jsonResponse, methodNotAllowed, normalizeThreadId, normalizeVisitorId, readThread, toPublicThread } from "./_shared/engagement-store.mts";

export default async (req: Request, _context: Context) => {
  if (req.method !== "GET") return methodNotAllowed();

  try {
    const url = new URL(req.url);
    const threadId = normalizeThreadId(url.searchParams.get("threadId"));
    const visitorHash = normalizeVisitorId(url.searchParams.get("visitorId"));
    const data = await readThread(threadId);

    return jsonResponse(toPublicThread(threadId, data, visitorHash));
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Unable to load thread" }, { status: 400 });
  }
};

export const config: Config = {
  path: "/api/thread",
};
