"use client";

import { useMemo, useState, useTransition } from "react";
import { STAGES, type Job, type Stage } from "@/lib/types";

export default function Board({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Stage | null>(null);
  const [adding, startAdd] = useState(false);
  const [isPending, startTransition] = useTransition();

  const byStage = useMemo(() => {
    const map: Record<Stage, Job[]> = { saved: [], applied: [], interview: [], offer: [], rejected: [] };
    for (const j of jobs) map[j.stage].push(j);
    return map;
  }, [jobs]);

  async function addJob(form: FormData) {
    setError(null);
    const payload = {
      title: String(form.get("title") ?? ""),
      company: String(form.get("company") ?? ""),
      url: String(form.get("url") ?? ""),
      salary: String(form.get("salary") ?? ""),
      remote: form.get("remote") === "on",
    };
    if (!payload.title.trim() || !payload.company.trim()) {
      setError("title and company are required");
      return;
    }
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "request failed");
      return;
    }
    const { job } = (await res.json()) as { job: Job };
    setJobs((prev) => [job, ...prev]);
    startAdd(false);
  }

  async function move(id: string, stage: Stage) {
    const prev = jobs;
    setJobs((p) => p.map((j) => (j.id === id ? { ...j, stage } : j)));
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) {
        setError("move failed — reverted");
        setJobs(prev);
      }
    });
  }

  async function remove(id: string) {
    const prev = jobs;
    setJobs((p) => p.filter((j) => j.id !== id));
    const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("delete failed — reverted");
      setJobs(prev);
    }
  }

  const counts = jobs.length;
  const offers = byStage.offer.length;

  return (
    <>
      <div className="stats" style={{ marginBottom: 12 }}>
        <span><b>{counts}</b> tracked</span>
        <span><b>{byStage.applied.length}</b> applied</span>
        <span><b>{byStage.interview.length}</b> interviewing</span>
        <span><b>{offers}</b> offers</span>
      </div>

      {error && <p className="error">{error}</p>}

      <form className="newjob" action={addJob}>
        <input type="text" name="title" placeholder="Job title" />
        <input type="text" name="company" placeholder="Company" />
        <input type="text" name="url" placeholder="URL (optional)" />
        <input type="text" name="salary" placeholder="Salary (optional)" />
        <label className="remote"><input type="checkbox" name="remote" /> Remote</label>
        <button type="submit" disabled={isPending}>Add</button>
      </form>

      <div className="board">
        {STAGES.map(({ key, label }) => (
          <div
            key={key}
            className={`col${dragOver === key ? " dragover" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(key); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(null);
              const id = e.dataTransfer.getData("text/plain");
              if (id) move(id, key);
            }}
          >
            <h2><span>{label}</span><span>{byStage[key].length}</span></h2>
            {byStage[key].length === 0 && <p className="empty">drop here</p>}
            {byStage[key].map((job) => (
              <div
                key={job.id}
                className="card"
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", job.id)}
              >
                <div className="title">{job.title}</div>
                <div className="company">{job.company}</div>
                <div className="meta">
                  {job.remote && <span className="tag remote">remote</span>}
                  {job.salary && <span className="tag">{job.salary}</span>}
                  {job.url && <a href={job.url} target="_blank" rel="noreferrer">link</a>}
                </div>
                <div className="actions">
                  <select
                    value={job.stage}
                    onChange={(e) => move(job.id, e.target.value as Stage)}
                    aria-label={`move ${job.title}`}
                  >
                    {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                  <button className="del" onClick={() => remove(job.id)}>delete</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
