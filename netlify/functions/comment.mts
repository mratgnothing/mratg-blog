import type { Config, Context } from "@netlify/functions";
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
} from "./_shared/engagement-store.mts";

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return methodNotAllowed();

  try {
    const body = await parseJsonBody(req);
    const threadId = normalizeThreadId(body.threadId);
    const name = cleanText(body.name, 32);
    const email = cleanText(body.email, 96).toLowerCase();
    const message = cleanMultiline(body.message, 1200);
    const image = normalizeImage(body.image);
    const visitorHash = normalizeVisitorId(body.visitorId);

    if (cleanText(body.website, 120)) {
      return jsonResponse({ ok: true });
    }
    if (!name || !email || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: "Name, valid email, and message are required" }, { status: 400 });
    }

    const data = await readThread(threadId);
    data.comments.unshift({
      id: newId("comment"),
      name,
      emailHash: hashValue(email),
      message,
      image,
      createdAt: new Date().toISOString(),
    });
    data.comments = data.comments.slice(0, 200);

    const nextData = await writeThread(threadId, data);
    return jsonResponse(toPublicThread(threadId, nextData, visitorHash), { status: 201 });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Unable to save comment" }, { status: 400 });
  }
};

export const config: Config = {
  path: "/api/comment",
};
