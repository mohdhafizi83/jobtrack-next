import type { Stage } from "./types";

/** Max accepted request body (bytes) for POST/PATCH JSON bodies. */
export const MAX_BODY_BYTES = 64 * 1024;

const MAX_SHORT_FIELD = 200; // title, company, url, salary, location
const MAX_NOTES = 2000;

const VALID_STAGES: Stage[] = ["saved", "applied", "interview", "offer", "rejected"];

/** Error carrying an HTTP status; messages are safe to return to clients. */
export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Read + parse a JSON body with a hard size cap.
 * Checks content-length first (cheap reject), then counts bytes while
 * streaming so a lying/missing content-length still cannot exceed the cap.
 */
export async function readJsonBody(req: Request): Promise<unknown> {
  const len = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(len) && len > MAX_BODY_BYTES) {
    throw new HttpError(413, "request body too large");
  }
  if (!req.body) throw new HttpError(400, "body must be JSON");

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      void reader.cancel().catch(() => {});
      throw new HttpError(413, "request body too large");
    }
    chunks.push(value);
  }

  const text = Buffer.concat(chunks).toString("utf8");
  if (!text.trim()) throw new HttpError(400, "body must be JSON");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "body must be valid JSON");
  }
}

function asObject(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "body must be a JSON object");
  }
  return body as Record<string, unknown>;
}

/** Required non-empty string with length cap. */
function reqStr(o: Record<string, unknown>, key: string, max: number): string {
  const v = o[key];
  if (typeof v !== "string" || !v.trim()) {
    throw new HttpError(400, `${key} is required and must be a non-empty string`);
  }
  if (v.length > max) {
    throw new HttpError(400, `${key} must be at most ${max} characters`);
  }
  return v.trim();
}

/** Optional string field: absent/null become undefined; wrong types rejected. */
function optStr(o: Record<string, unknown>, key: string, max: number): string | undefined {
  const v = o[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string") {
    throw new HttpError(400, `${key} must be a string`);
  }
  if (v.length > max) {
    throw new HttpError(400, `${key} must be at most ${max} characters`);
  }
  return v.trim() || undefined;
}

export interface CreateJobInput {
  title: string;
  company: string;
  url?: string;
  salary?: string;
  location?: string;
  remote?: boolean;
  notes?: string;
}

/** Validate a POST /api/jobs body. Throws HttpError(400) on any violation. */
export function parseCreateJob(body: unknown): CreateJobInput {
  const o = asObject(body);
  // Preserve the original contract message for the classic missing-fields case.
  if (!o.title || !o.company) {
    throw new HttpError(400, "title and company are required");
  }
  const remote = o.remote;
  if (remote !== undefined && remote !== null && typeof remote !== "boolean") {
    throw new HttpError(400, "remote must be a boolean");
  }
  return {
    title: reqStr(o, "title", MAX_SHORT_FIELD),
    company: reqStr(o, "company", MAX_SHORT_FIELD),
    url: optStr(o, "url", MAX_SHORT_FIELD),
    salary: optStr(o, "salary", MAX_SHORT_FIELD),
    location: optStr(o, "location", MAX_SHORT_FIELD),
    notes: optStr(o, "notes", MAX_NOTES),
    remote: typeof remote === "boolean" ? remote : undefined,
  };
}

/** Validate a PATCH /api/jobs/:id body. Throws HttpError(400) on any violation. */
export function parseStage(body: unknown): Stage {
  const o = asObject(body);
  const stage = o.stage;
  if (typeof stage !== "string" || !VALID_STAGES.includes(stage as Stage)) {
    throw new HttpError(400, `stage must be one of ${VALID_STAGES.join(", ")}`);
  }
  return stage as Stage;
}
