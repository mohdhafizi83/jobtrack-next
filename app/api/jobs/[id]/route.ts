import { NextRequest, NextResponse } from "next/server";
import { moveJob, deleteJob } from "@/lib/store";
import { HttpError, parseStage, readJsonBody } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const stage = parseStage(await readJsonBody(req));
    const job = await moveJob(id, stage);
    if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ job });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("PATCH /api/jobs/:id failed:", err); // full detail server-side only
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ok = await deleteJob(id);
    if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/jobs/:id failed:", err);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
