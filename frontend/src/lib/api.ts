const API_BASE = "/api";

export async function startSession(): Promise<{
  speech: string;
  plan?: Plan | null;
  taskPlan?: TaskStep[];
}> {
  const res = await fetch(`${API_BASE}/start`, { method: "POST" });
  return res.json();
}

export async function sendMessage(message: string): Promise<{
  speech: string;
  plan?: Plan | null;
  taskPlan?: TaskStep[];
}> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  return res.json();
}

export async function getPlan(): Promise<{ plan: Plan | null; taskPlan: TaskStep[] }> {
  const res = await fetch(`${API_BASE}/plan`);
  return res.json();
}

export async function getStatus(): Promise<{ status: string; pluginConnected: boolean }> {
  const res = await fetch(`${API_BASE}/status`);
  return res.json();
}

export async function getTTS(text: string): Promise<ArrayBuffer> {
  const res = await fetch(`${API_BASE}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return res.arrayBuffer();
}

export interface Plan {
  name: string;
  world: string;
  objects: string;
  characters?: string;
  animations?: string;
  gameplay: string;
  audio: string;
  status: "waiting_approval" | "building" | "complete" | "failed";
}

export interface TaskStep {
  id: string;
  label: string;
  status: "pending" | "active" | "done";
  progress: number;
  detail: string;
}
