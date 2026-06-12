import {
  cleanMultiline,
  cleanText,
  hashValue,
  jsonResponse,
  methodNotAllowed,
  newId,
  normalizeImage,
  normalizeThreadId,
  normalizeVisitorId,
  parseJsonBody,
  readThread,
  toPublicThread,
  writeThread,
  type PagesContext,
} from "../_shared/engagement-store";

export async function onRequestPost({ request, env }: PagesContext) {
  try {
    const body = await parseJsonBody(request);
    const threadId = normalizeThreadId(body.threadId);
    const name = cleanText(body.name, 32);
    const email = cleanText(body.email, 96).toLowerCase();
    const message = cleanMultiline(body.message, 1200);
    const image = normalizeImage(body.image);
    const visitorHash = await normalizeVisitorId(body.visitorId);

    if (cleanText(body.website, 120)) {
      return jsonResponse({ ok: true });
    }
    if (!name || !email || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: "Name, valid email, and message are required" }, { status: 400 });
    }

    const data = await readThread(env, threadId);
    data.comments.unshift({
      id: newId("comment"),
      name,
      emailHash: await hashValue(email),
      message,
      image,
      createdAt: new Date().toISOString(),
    });
    data.comments = data.comments.slice(0, 200);

    const nextData = await writeThread(env, threadId, data);
    return jsonResponse(toPublicThread(threadId, nextData, visitorHash), { status: 201 });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Unable to save comment" }, { status: 400 });
  }
}

export function onRequest() {
  return methodNotAllowed();
}
