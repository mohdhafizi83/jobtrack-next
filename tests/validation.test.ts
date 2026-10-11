import test from "node:test";
import assert from "node:assert/strict";
import {
  HttpError,
  MAX_BODY_BYTES,
  parseCreateJob,
  parseStage,
  readJsonBody,
} from "../lib/validation.ts";

function expectHttpError(fn: () => unknown, status: number): void {
  try {
    fn();
    assert.fail(`expected HttpError(${status})`);
  } catch (err) {
    assert.ok(err instanceof HttpError, `expected HttpError, got ${String(err)}`);
    assert.equal((err as HttpError).status, status);
    assert.ok(!(err as Error).message.includes("undefined"));
  }
}

test("parseCreateJob accepts a minimal valid body", () => {
  const input = parseCreateJob({ title: "Engineer", company: "Acme" });
  assert.equal(input.title, "Engineer");
  assert.equal(input.company, "Acme");
});

test("parseCreateJob rejects missing title/company with original message", () => {
  expectHttpError(() => parseCreateJob({ title: "x" }), 400);
  expectHttpError(() => parseCreateJob({ company: "x" }), 400);
  try {
    parseCreateJob({});
  } catch (err) {
    assert.match((err as Error).message, /title and company are required/);
  }
});

test("parseCreateJob rejects oversize strings (>200 chars)", () => {
  expectHttpError(() => parseCreateJob({ title: "t".repeat(201), company: "A" }), 400);
  expectHttpError(() => parseCreateJob({ title: "T", company: "c".repeat(201) }), 400);
  expectHttpError(
    () => parseCreateJob({ title: "T", company: "C", notes: "n".repeat(2001) }),
    400,
  );
  // boundary: exactly 200 is fine
  assert.equal(parseCreateJob({ title: "t".repeat(200), company: "C" }).title.length, 200);
});

test("parseCreateJob rejects wrong types", () => {
  expectHttpError(() => parseCreateJob({ title: 123, company: "A" }), 400);
  expectHttpError(() => parseCreateJob({ title: "T", company: { a: 1 } }), 400);
  expectHttpError(() => parseCreateJob({ title: "T", company: "A", remote: "yes" }), 400);
  expectHttpError(() => parseCreateJob({ title: "T", company: "A", url: 42 }), 400);
  expectHttpError(() => parseCreateJob({ title: "   ", company: "A" }), 400);
});

test("parseCreateJob rejects non-object JSON", () => {
  for (const bad of [null, undefined, "string", 42, [1, 2], true]) {
    expectHttpError(() => parseCreateJob(bad), 400);
  }
});

test("parseStage rejects invalid stage and non-objects", () => {
  assert.equal(parseStage({ stage: "applied" }), "applied");
  expectHttpError(() => parseStage({ stage: "hired" }), 400);
  expectHttpError(() => parseStage({ stage: 3 }), 400);
  expectHttpError(() => parseStage({}), 400);
  expectHttpError(() => parseStage(["applied"]), 400);
  expectHttpError(() => parseStage(null), 400);
});

test("readJsonBody rejects content-length over cap with 413", async () => {
  const req = new Request("http://localhost/api/jobs", {
    method: "POST",
    headers: { "content-type": "application/json", "content-length": String(MAX_BODY_BYTES + 1) },
    body: "{}",
  });
  await assert.rejects(readJsonBody(req), (err: unknown) => (err as HttpError).status === 413);
});

test("readJsonBody enforces cap on streamed bytes even without content-length", async () => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const chunk = new Uint8Array(16 * 1024);
      for (let i = 0; i < 8; i++) controller.enqueue(chunk); // 128KB > 64KB cap
      controller.close();
    },
  });
  const req = new Request("http://localhost/api/jobs", {
    method: "POST",
    // @ts-expect-error Node's undici Request requires duplex for stream bodies
    duplex: "half",
    body: stream,
  });
  await assert.rejects(readJsonBody(req), (err: unknown) => (err as HttpError).status === 413);
});

test("readJsonBody parses valid JSON and rejects invalid with 400", async () => {
  const ok = new Request("http://localhost/api/jobs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "T", company: "C" }),
  });
  assert.deepEqual(await readJsonBody(ok), { title: "T", company: "C" });

  const bad = new Request("http://localhost/api/jobs", {
    method: "POST",
    body: "{not json",
  });
  await assert.rejects(readJsonBody(bad), (err: unknown) => (err as HttpError).status === 400);
});
