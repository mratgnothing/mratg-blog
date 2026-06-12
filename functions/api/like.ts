import { jsonResponse, methodNotAllowed, normalizeThreadId, normalizeVisitorId, parseJsonBody, readThread, toPublicThread, writeThread, type PagesContext } from "../_shared/engagement-store";

export async function onRequestPost({ request, env }: PagesContext) {
  try {
    const body = await parseJsonBody(request);
    const threadId = normalizeThreadId(body.threadId);
    const visitorHash = await normalizeVisitorId(body.visitorId);
    if (!visitorHash) {
      return jsonResponse({ error: "Visitor id is required" }, { status: 400 });
    }

    const data = await readThread(env, threadId);
    const current = new Set(data.likes.visitorIds);
    const shouldLike = typeof body.liked === "boolean" ? body.liked : !current.has(visitorHash);

    if (shouldLike) {
      current.add(visitorHash);
    } else {
      current.delete(visitorHash);
    }

    data.likes.visitorIds = Array.from(current);
    const nextData = await writeThread(env, threadId, data);
    return jsonResponse(toPublicThread(threadId, nextData, visitorHash));
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Unable to save like" }, { status: 400 });
  }
}

export function onRequest() {
  return methodNotAllowed();
}
