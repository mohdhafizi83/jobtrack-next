import { NextRequest, NextResponse } from "next/server";
import { moveJob, deleteJob } from "@/lib/store";
import type { Stage } from "@/lib/types";

const VALID: Stage[] = ["saved", "applied", "interview", "offer", "rejected"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const stage = body?.stage as Stage;
  if (!VALID.includes(stage)) {
    return NextResponse.json({ error: `stage must be one of ${VALID.join(", ")}` }, { status: 400 });
  }
  const job = await moveJob(id, stage);
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ job });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = await deleteJob(id);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
