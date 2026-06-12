import type { Config, Context } from "@netlify/functions";
import { jsonResponse, methodNotAllowed, normalizeThreadId, normalizeVisitorId, parseJsonBody, readThread, toPublicThread, writeThread } from "./_shared/engagement-store.mts";

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return methodNotAllowed();

  try {
    const body = await parseJsonBody(req);
    const threadId = normalizeThreadId(body.threadId);
    const visitorHash = normalizeVisitorId(body.visitorId);
    if (!visitorHash) {
      return jsonResponse({ error: "Visitor id is required" }, { status: 400 });
    }

    const data = await readThread(threadId);
    const current = new Set(data.likes.visitorIds);
    const shouldLike = typeof body.liked === "boolean" ? body.liked : !current.has(visitorHash);

    if (shouldLike) {
      current.add(visitorHash);
    } else {
      current.delete(visitorHash);
    }

    data.likes.visitorIds = Array.from(current);
    const nextData = await writeThread(threadId, data);
    return jsonResponse(toPublicThread(threadId, nextData, visitorHash));
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Unable to save like" }, { status: 400 });
  }
};

export const config: Config = {
  path: "/api/like",
};
