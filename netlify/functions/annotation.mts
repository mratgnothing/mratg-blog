import type { Config, Context } from "@netlify/functions";
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
} from "./_shared/engagement-store.mts";

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST" && req.method !== "DELETE") return methodNotAllowed();

  try {
    const body = await parseJsonBody(req);
    const threadId = normalizeThreadId(body.threadId);
    const visitorHash = normalizeVisitorId(body.visitorId);
    if (!visitorHash) {
      return jsonResponse({ error: "Visitor id is required" }, { status: 400 });
    }

    const data = await readThread(threadId);

    if (req.method === "DELETE") {
      const id = cleanMultiline(body.id, 120);
      data.annotations = data.annotations.filter((item) => item.id !== id || item.ownerId !== visitorHash);
      const nextData = await writeThread(threadId, data);
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

    const nextData = await writeThread(threadId, data);
    return jsonResponse(toPublicThread(threadId, nextData, visitorHash), { status: 201 });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Unable to save annotation" }, { status: 400 });
  }
};

export const config: Config = {
  path: "/api/annotation",
};
