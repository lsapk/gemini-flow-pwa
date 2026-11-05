export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

export function object(value: unknown, name = "body"): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new HttpError(400, `Invalid ${name}`);
  return value as Record<string, unknown>;
}

export function text(value: unknown, name: string, max = 8000): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new HttpError(400, `Invalid ${name}`);
  return value.trim();
}

export function assertIdentity(body: Record<string, unknown>, userId: string): void {
  for (const key of ["userId", "user_id"]) {
    if (body[key] !== undefined && body[key] !== userId) throw new HttpError(403, "User identity does not match the session");
  }
}

export function allowedOrigin(origin: string | null, configured: string): boolean {
  if (!origin) return true; // Native clients still need a verified access token.
  return configured.split(",").map((value) => value.trim()).filter(Boolean).includes(origin);
}

export async function readText(req: { headers: Headers; body: ReadableStream<Uint8Array> | null }, maxBytes: number): Promise<string> {
  const declared = req.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > maxBytes)) throw new HttpError(413, "Request body too large");
  if (!req.body) throw new HttpError(400, "Request body is required");
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new HttpError(413, "Request body too large"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

export async function jsonBody(req: Request, maxBytes = 64 * 1024): Promise<Record<string, unknown>> {
  if (req.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new HttpError(415, "Expected application/json");
  const raw = await readText(req, maxBytes);
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new HttpError(400, "Invalid JSON"); }
  return object(parsed);
}

export function chatHistory(value: unknown): { role: "user" | "model"; parts: { text: string }[] }[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 20) throw new HttpError(400, "Invalid conversation history");
  return value.map((item) => {
    const entry = object(item, "message");
    if (entry.role !== "user" && entry.role !== "assistant") throw new HttpError(400, "Invalid message role");
    return { role: entry.role === "assistant" ? "model" : "user", parts: [{ text: text(entry.content, "message content", 4000) }] };
  });
}
