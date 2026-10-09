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
