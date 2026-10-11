import { NextRequest, NextResponse, connection } from "next/server";
import { listJobs, createJob } from "@/lib/store";
import { HttpError, parseCreateJob, readJsonBody } from "@/lib/validation";

export async function GET() {
  await connection(); // always serve fresh store state
  return NextResponse.json({ jobs: await listJobs() });
}

export async function POST(req: NextRequest) {
  try {
    const input = parseCreateJob(await readJsonBody(req));
    const job = await createJob(input);
    return NextResponse.json({ job }, { status: 201 });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST /api/jobs failed:", err); // full detail server-side only
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
