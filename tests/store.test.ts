import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.JOBTRACK_DB = path.join(await fs.mkdtemp(path.join(os.tmpdir(), "jobtrack-")), "board.json");

const store = await import("../lib/store.ts");

test("createJob validates and defaults stage=saved", async () => {
  const job = await store.createJob({ title: "Backend Engineer", company: "Acme", remote: true });
  assert.equal(job.stage, "saved");
  assert.equal(job.remote, true);
  assert.ok(job.id);
});

test("moveJob transitions stage and bumps updatedAt", async () => {
  const job = await store.createJob({ title: "ETL Dev", company: "PowTech" });
  const moved = await store.moveJob(job.id, "interview");
  assert.equal(moved?.stage, "interview");
  assert.ok(moved!.updatedAt >= job.updatedAt);
});

test("moveJob on unknown id returns null", async () => {
  assert.equal(await store.moveJob("nope", "offer"), null);
});

test("deleteJob removes and reports miss", async () => {
  const job = await store.createJob({ title: "X", company: "Y" });
  assert.equal(await store.deleteJob(job.id), true);
  assert.equal(await store.deleteJob(job.id), false);
});

test("listJobs sorts by updatedAt desc", async () => {
  const a = await store.createJob({ title: "A", company: "A" });
  await store.createJob({ title: "B", company: "B" });
  await store.moveJob(a.id, "applied");
  const jobs = await store.listJobs();
  assert.equal(jobs[0].title, "A");
});

test("write is atomic: simulated crash leaves original intact + stray tmp", async () => {
  const dbPath = process.env.JOBTRACK_DB!;
  const dir = path.dirname(dbPath);

  await store.createJob({ title: "Survivor", company: "Acme" });
  const before = await fs.readFile(dbPath, "utf8");
  const beforeTitles = JSON.parse(before).jobs.map((j: { title: string }) => j.title);

  // Simulate a crash between temp-file write and rename: rename blows up.
  const realRename = fs.rename;
  fs.rename = (async () => {
    throw new Error("simulated crash before rename");
  }) as typeof fs.rename;
  try {
    await assert.rejects(() => store.createJob({ title: "Lost", company: "CrashCo" }));
  } finally {
    fs.rename = realRename;
  }

  // Original board is byte-identical and still parses — no truncation.
  const after = await fs.readFile(dbPath, "utf8");
  assert.equal(after, before);
  const board = JSON.parse(after);
  assert.deepEqual(board.jobs.map((j: { title: string }) => j.title), beforeTitles);

  // The interrupted write left only a stray tmp file behind...
  const strays = (await fs.readdir(dir)).filter((f) => f.endsWith(".tmp"));
  assert.equal(strays.length, 1);

  // ...and the next successful write consumes a fresh tmp and renames over.
  await store.createJob({ title: "Recovery", company: "Acme" });
  const recovered = JSON.parse(await fs.readFile(dbPath, "utf8"));
  const recoveredTitles = recovered.jobs.map((j: { title: string }) => j.title);
  assert.ok(recoveredTitles.includes("Survivor"));
  assert.ok(recoveredTitles.includes("Recovery"));
  assert.ok(!recoveredTitles.includes("Lost"));
  const leftovers = (await fs.readdir(dir)).filter(
    (f) => f.endsWith(".tmp") && f !== strays[0],
  );
  assert.equal(leftovers.length, 0);
});
