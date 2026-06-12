import {
  cleanMultiline,
  jsonResponse,
  methodNotAllowed,
  newId,
  normalizeThreadId,
  normalizeVisitorId,
  parseJsonBody,
  readThread,
  toPublicThread,
  writeThread,
  type PagesContext,
} from "../_shared/engagement-store";

export async function onRequestPost(context: PagesContext) {
  return updateAnnotation(context);
}

export async function onRequestDelete(context: PagesContext) {
  return updateAnnotation(context);
}

export function onRequest() {
  return methodNotAllowed();
}

async function updateAnnotation({ request, env }: PagesContext) {
  try {
    const body = await parseJsonBody(request);
    const threadId = normalizeThreadId(body.threadId);
    const visitorHash = await normalizeVisitorId(body.visitorId);
    if (!visitorHash) {
      return jsonResponse({ error: "Visitor id is required" }, { status: 400 });
    }

    const data = await readThread(env, threadId);

    if (request.method === "DELETE") {
      const id = cleanMultiline(body.id, 120);
      data.annotations = data.annotations.filter((item) => item.id !== id || item.ownerId !== visitorHash);
      const nextData = await writeThread(env, threadId, data);
      return jsonResponse(toPublicThread(threadId, nextData, visitorHash));
    }

    const text = cleanMultiline(body.text, 260);
    const note = cleanMultiline(body.note, 360);
    if (!text || !note) {
      return jsonResponse({ error: "Selected text and note are required" }, { status: 400 });
    }

    data.annotations.unshift({
      id: newId("annotation"),
      text,
      note,
      ownerId: visitorHash,
      createdAt: new Date().toISOString(),
    });
    data.annotations = data.annotations.slice(0, 300);

    const nextData = await writeThread(env, threadId, data);
    return jsonResponse(toPublicThread(threadId, nextData, visitorHash), { status: 201 });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Unable to save annotation" }, { status: 400 });
  }
}
