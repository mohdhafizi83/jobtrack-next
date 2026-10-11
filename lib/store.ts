import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type { Board, Job, Stage } from "./types";

const DB_PATH = process.env.JOBTRACK_DB ?? path.join(process.cwd(), "data", "board.json");

async function read(): Promise<Board> {
  try {
    const raw = await fs.readFile(DB_PATH /*turbopackIgnore: true*/, "utf8");
    return JSON.parse(raw) as Board;
  } catch {
    return { jobs: [] };
  }
}

/**
 * Atomic write: serialize to a unique temp file in the same directory, then
 * rename over the target (rename is atomic on POSIX). A crash mid-write can
 * therefore never leave a truncated/corrupt board.json — the old file stays
 * intact and only a stray .tmp file is left behind (harmless; each write uses
 * a fresh unique name).
 */
async function write(board: Board): Promise<void> {
  const dir = path.dirname(DB_PATH);
  await fs.mkdir(dir, { recursive: true });
  const tmp = path.join(dir, `.board.json.${process.pid}.${crypto.randomUUID()}.tmp`);
  await fs.writeFile(tmp, JSON.stringify(board, null, 2), "utf8");
  await fs.rename(tmp, DB_PATH /*turbopackIgnore: true*/);
}

const now = () => new Date().toISOString();

export async function listJobs(): Promise<Job[]> {
  const board = await read();
  return board.jobs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createJob(input: {
  title: string;
  company: string;
  url?: string;
  salary?: string;
  location?: string;
  remote?: boolean;
  notes?: string;
}): Promise<Job> {
  const board = await read();
  const job: Job = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    company: input.company.trim(),
    url: input.url?.trim() || undefined,
    salary: input.salary?.trim() || undefined,
    location: input.location?.trim() || undefined,
    remote: input.remote ?? false,
    stage: "saved",
    notes: input.notes?.trim() || undefined,
    createdAt: now(),
    updatedAt: now(),
  };
  board.jobs.push(job);
  await write(board);
  return job;
}

export async function moveJob(id: string, stage: Stage): Promise<Job | null> {
  const board = await read();
  const job = board.jobs.find((j) => j.id === id);
  if (!job) return null;
  job.stage = stage;
  job.updatedAt = now();
  await write(board);
  return job;
}

export async function deleteJob(id: string): Promise<boolean> {
  const board = await read();
  const before = board.jobs.length;
  board.jobs = board.jobs.filter((j) => j.id !== id);
  await write(board);
  return board.jobs.length < before;
}
