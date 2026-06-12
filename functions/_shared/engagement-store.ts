type KvNamespace = {
  get<T = unknown>(key: string, options: { type: "json" }): Promise<T | null>;
  put(key: string, value: string): Promise<void>;
};

export type Env = {
  MRATG_ENGAGEMENT: KvNamespace;
};

export type PagesContext = {
  request: Request;
  env: Env;
};

type StoredComment = {
  id: string;
  name: string;
  emailHash: string;
  message: string;
  image: string;
  createdAt: string;
};

type StoredAnnotation = {
  id: string;
  text: string;
  note: string;
  ownerId: string;
  createdAt: string;
};

type ThreadData = {
  version: 1;
  comments: StoredComment[];
  likes: {
    visitorIds: string[];
  };
  annotations: StoredAnnotation[];
  updatedAt: string;
};

type PublicThread = {
  threadId: string;
  comments: Array<Omit<StoredComment, "emailHash">>;
  likes: {
    count: number;
    liked: boolean;
  };
  annotations: Array<Omit<StoredAnnotation, "ownerId"> & { owned: boolean }>;
};

const MAX_IMAGE_LENGTH = 2_800_000;

export function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers,
    },
  });
}

export function methodNotAllowed() {
  return jsonResponse({ error: "Method not allowed" }, { status: 405 });
}

export function cleanText(value: unknown, maxLength: number) {
  return String(value || "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function cleanMultiline(value: unknown, maxLength: number) {
  return String(value || "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function normalizeThreadId(value: unknown) {
  const threadId = String(value || "").trim();
  if (!/^(post|diary):[a-zA-Z0-9/_:.-]{1,180}$/.test(threadId)) {
    throw new Error("Invalid thread id");
  }
  return threadId;
}

export async function normalizeVisitorId(value: unknown) {
  const visitorId = String(value || "").trim();
  if (!visitorId || visitorId.length > 120) return "";
  return hashValue(visitorId);
}

export async function hashValue(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function normalizeImage(value: unknown) {
  const image = String(value || "");
  if (!image) return "";
  if (image.length > MAX_IMAGE_LENGTH) {
    throw new Error("Image is too large");
  }
  if (!/^data:image\/(?:png|jpe?g|gif|webp);base64,[a-zA-Z0-9+/=\s]+$/.test(image)) {
    throw new Error("Invalid image");
  }
  return image;
}

export async function parseJsonBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("Invalid JSON body");
    }
    return body as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON body");
  }
}

export async function readThread(env: Env, threadId: string): Promise<ThreadData> {
  const data = await env.MRATG_ENGAGEMENT.get<ThreadData>(threadKey(threadId), { type: "json" });
  if (isThreadData(data)) return data;
  return emptyThread();
}

export async function writeThread(env: Env, threadId: string, data: ThreadData) {
  const nextData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  await env.MRATG_ENGAGEMENT.put(threadKey(threadId), JSON.stringify(nextData));
  return nextData;
}

export function toPublicThread(threadId: string, data: ThreadData, visitorHash = ""): PublicThread {
  return {
    threadId,
    comments: data.comments.map(({ emailHash, ...comment }) => comment),
    likes: {
      count: data.likes.visitorIds.length,
      liked: Boolean(visitorHash && data.likes.visitorIds.includes(visitorHash)),
    },
    annotations: data.annotations.map(({ ownerId, ...annotation }) => ({
      ...annotation,
      owned: Boolean(visitorHash && ownerId === visitorHash),
    })),
  };
}

export function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function threadKey(threadId: string) {
  return `threads/${encodeURIComponent(threadId)}.json`;
}

function emptyThread(): ThreadData {
  return {
    version: 1,
    comments: [],
    likes: {
      visitorIds: [],
    },
    annotations: [],
    updatedAt: new Date().toISOString(),
  };
}

function isThreadData(value: unknown): value is ThreadData {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<ThreadData>;
  return Array.isArray(data.comments) && Array.isArray(data.likes?.visitorIds) && Array.isArray(data.annotations);
}
