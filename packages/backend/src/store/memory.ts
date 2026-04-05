import { v4 as uuidv4 } from "uuid";

export interface SessionFile {
  fileId: string;
  displayName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  sourceType: "primary" | "reference";
  uploadStatus: "uploaded" | "ready" | "failed";
}

export interface CheckpointStatus {
  status: "not_started" | "in_progress" | "ready" | "blocked" | "done";
  updatedAt: string;
}

export interface Session {
  sessionId: string;
  name?: string;
  status: "active" | "complete" | "failed" | "canceled";
  currentStep: number;
  createdAt: string;
  updatedAt: string;
  files: SessionFile[];
  checkpoints: {
    upload: CheckpointStatus;
    pageMap: CheckpointStatus;
    settings: CheckpointStatus;
    review: CheckpointStatus;
    preview: CheckpointStatus;
    complete: CheckpointStatus;
  };
}

export interface CpmState {
  revision: number;
  data: Record<string, unknown>;
}

export interface SettingsState {
  revision: number;
  data: Record<string, unknown>;
}

export interface AiEstimate {
  estimateId: string;
  action: string;
  provider: string;
  modelFamily: string;
  estimatedPromptTokens: number;
  estimatedCompletionTokens: number;
  estimatedTotalTokens: number;
  estimatedCostUsd: number;
  currency: "USD";
  expiresAt: string;
  confirmed: boolean;
}

export interface Job {
  jobId: string;
  type: "preview" | "compile";
  state: "queued" | "running" | "succeeded" | "failed" | "canceled";
  moderation?: Record<string, unknown>;
  error?: { code: string; message: string; retryable: boolean };
}

const sessions = new Map<string, Session>();
const cpmStore = new Map<string, CpmState>();
const settingsStore = new Map<string, SettingsState>();
const estimateStore = new Map<string, AiEstimate>();
const jobStore = new Map<string, Job>();

function now(): string {
  return new Date().toISOString();
}

function newCheckpoint(): CheckpointStatus {
  return { status: "not_started", updatedAt: now() };
}

export function createSession(name?: string): Session {
  const sessionId = `ses_${uuidv4().replace(/-/g, "").slice(0, 12)}`;
  const session: Session = {
    sessionId,
    name,
    status: "active",
    currentStep: 1,
    createdAt: now(),
    updatedAt: now(),
    files: [],
    checkpoints: {
      upload: newCheckpoint(),
      pageMap: newCheckpoint(),
      settings: newCheckpoint(),
      review: newCheckpoint(),
      preview: newCheckpoint(),
      complete: newCheckpoint(),
    },
  };
  sessions.set(sessionId, session);
  cpmStore.set(sessionId, { revision: 0, data: { clusters: [], metadata: {} } });
  settingsStore.set(sessionId, { revision: 0, data: {} });
  return session;
}

export function getSession(sessionId: string): Session | undefined {
  return sessions.get(sessionId);
}

export function addFile(
  sessionId: string,
  displayName: string,
  mimeType: string,
  sizeBytes: number,
  sourceType: "primary" | "reference"
): SessionFile | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;
  const fileId = `fil_${uuidv4().replace(/-/g, "").slice(0, 12)}`;
  const sha256 = uuidv4().replace(/-/g, "");
  const file: SessionFile = {
    fileId,
    displayName,
    mimeType,
    sizeBytes,
    sha256,
    sourceType,
    uploadStatus: "ready",
  };
  session.files.push(file);
  session.updatedAt = now();
  session.checkpoints.upload = { status: "ready", updatedAt: now() };
  return file;
}

export function getCpm(sessionId: string): CpmState | undefined {
  return cpmStore.get(sessionId);
}

export function patchCpm(
  sessionId: string,
  baseRevision: number,
  operations: Array<{ op: string; path: string; from?: string; value?: unknown }>
): { revision: number; cpm: Record<string, unknown>; operationResults: Array<{ index: number; status: string; error?: object }> } | { error: string } {
  const state = cpmStore.get(sessionId);
  if (!state) return { error: "session_not_found" };
  if (state.revision !== baseRevision) {
    return { error: "revision_conflict" };
  }

  const results: Array<{ index: number; status: string; error?: object }> = [];
  const data = JSON.parse(JSON.stringify(state.data));

  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    try {
      if (op.op === "add" || op.op === "replace") {
        setNestedValue(data, op.path, op.value);
        results.push({ index: i, status: "applied" });
      } else if (op.op === "remove") {
        removeNestedValue(data, op.path);
        results.push({ index: i, status: "applied" });
      } else if (op.op === "test") {
        const current = getNestedValue(data, op.path);
        if (JSON.stringify(current) === JSON.stringify(op.value)) {
          results.push({ index: i, status: "applied" });
        } else {
          results.push({ index: i, status: "failed", error: { message: "test_value_mismatch" } });
        }
      } else {
        results.push({ index: i, status: "applied" });
      }
    } catch {
      results.push({ index: i, status: "failed", error: { message: "operation_error" } });
    }
  }

  state.revision += 1;
  state.data = data;
  cpmStore.set(sessionId, state);

  return { revision: state.revision, cpm: state.data, operationResults: results };
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split("/").filter(Boolean);
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current)) {
      current[parts[i]] = {};
    }
    current = current[parts[i]] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

function removeNestedValue(obj: Record<string, unknown>, path: string): void {
  const parts = path.split("/").filter(Boolean);
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    current = current[parts[i]] as Record<string, unknown>;
  }
  delete current[parts[parts.length - 1]];
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split("/").filter(Boolean);
  let current: unknown = obj;
  for (const part of parts) {
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function getSettings(sessionId: string): SettingsState | undefined {
  return settingsStore.get(sessionId);
}

export function putSettings(sessionId: string, data: Record<string, unknown>): SettingsState | undefined {
  const state = settingsStore.get(sessionId);
  if (!state) return undefined;
  state.revision += 1;
  state.data = data;
  settingsStore.set(sessionId, state);
  return state;
}

export function createEstimate(sessionId: string, action: string, providerPolicy?: Record<string, unknown>): AiEstimate {
  const estimateId = `est_${uuidv4().replace(/-/g, "").slice(0, 12)}`;
  const provider = (providerPolicy?.provider as string) || "internal";
  const modelFamily = provider === "gemini" ? "gemini-2.5-flash" : provider === "copilot" ? "copilot-chat-compatible" : "deterministic-rules-engine";
  const isPaid = provider !== "internal";
  const estimate: AiEstimate = {
    estimateId,
    action,
    provider,
    modelFamily,
    estimatedPromptTokens: isPaid ? 1200 : 0,
    estimatedCompletionTokens: isPaid ? 800 : 0,
    estimatedTotalTokens: isPaid ? 2000 : 0,
    estimatedCostUsd: isPaid ? 0.003 : 0,
    currency: "USD",
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    confirmed: false,
  };
  estimateStore.set(estimateId, estimate);
  return estimate;
}

export function confirmEstimate(estimateId: string): AiEstimate | undefined {
  const estimate = estimateStore.get(estimateId);
  if (!estimate) return undefined;
  if (new Date(estimate.expiresAt) < new Date()) return undefined;
  estimate.confirmed = true;
  return estimate;
}

export function getEstimate(estimateId: string): AiEstimate | undefined {
  return estimateStore.get(estimateId);
}

export function createJob(sessionId: string, type: "preview" | "compile", moderation?: Record<string, unknown>): Job {
  const jobId = `job_${uuidv4().replace(/-/g, "").slice(0, 12)}`;
  const job: Job = {
    jobId,
    type,
    state: "queued",
    moderation,
  };
  jobStore.set(jobId, job);

  setTimeout(() => {
    const j = jobStore.get(jobId);
    if (j && j.state === "queued") {
      j.state = "running";
    }
  }, 500);

  setTimeout(() => {
    const j = jobStore.get(jobId);
    if (j && j.state === "running") {
      j.state = "succeeded";
    }
  }, 2000);

  return job;
}

export function getJob(jobId: string): Job | undefined {
  return jobStore.get(jobId);
}
