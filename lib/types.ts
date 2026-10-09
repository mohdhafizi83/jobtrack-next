export type Stage = "saved" | "applied" | "interview" | "offer" | "rejected";

export interface Job {
  id: string;
  title: string;
  company: string;
  url?: string;
  salary?: string;
  location?: string;
  remote: boolean;
  stage: Stage;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  jobs: Job[];
}

export const STAGES: { key: Stage; label: string }[] = [
  { key: "saved", label: "Saved" },
  { key: "applied", label: "Applied" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offer" },
  { key: "rejected", label: "Rejected" },
];
