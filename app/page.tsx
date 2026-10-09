import { connection } from "next/server";
import { listJobs } from "@/lib/store";
import Board from "@/components/Board";

export const instant = false; // store reads are request-time data (cacheComponents)

export default async function Home() {
  await connection(); // render per-request, always fresh store
  const jobs = await listJobs();
  return (
    <main>
      <div className="pageheader">
        <div>
          <h1>JobTrack</h1>
          <p className="sub">
            Job application kanban — Next.js 16 App Router, typed route handlers,
            file-backed store, native drag &amp; drop.
          </p>
        </div>
      </div>
      <Board initialJobs={jobs} />
    </main>
  );
}
