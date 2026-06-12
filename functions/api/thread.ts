import { jsonResponse, methodNotAllowed, normalizeThreadId, normalizeVisitorId, readThread, toPublicThread, type PagesContext } from "../_shared/engagement-store";

export async function onRequestGet({ request, env }: PagesContext) {
  try {
    const url = new URL(request.url);
    const threadId = normalizeThreadId(url.searchParams.get("threadId"));
    const visitorHash = await normalizeVisitorId(url.searchParams.get("visitorId"));
    const data = await readThread(env, threadId);

    return jsonResponse(toPublicThread(threadId, data, visitorHash));
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Unable to load thread" }, { status: 400 });
  }
}

export function onRequest() {
  return methodNotAllowed();
}
