import { NextRequest, NextResponse, connection } from "next/server";
import { listJobs, createJob } from "@/lib/store";

export async function GET() {
  await connection(); // always serve fresh store state
  return NextResponse.json({ jobs: await listJobs() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.company) {
    return NextResponse.json({ error: "title and company are required" }, { status: 400 });
  }
  const job = await createJob(body);
  return NextResponse.json({ job }, { status: 201 });
}
