const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface Session {
  sessionId: string;
  name?: string;
  status: string;
  currentStep: number;
  createdAt: string;
  updatedAt: string;
  files: unknown[];
  checkpoints: Record<string, { status: string; updatedAt: string }>;
}

export interface ProviderCapabilities {
  version: string;
  providers: Array<{
    provider: string;
    enabled: boolean;
    modelFamilies: string[];
    notes?: string;
  }>;
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
  currency: string;
  expiresAt: string;
}

export interface PatchResult {
  revision: number;
  cpm: Record<string, unknown>;
  operationResults: Array<{ index: number; status: string; error?: object }>;
}

export interface Job {
  jobId: string;
  type: string;
  state: string;
  error?: { code: string; message: string; retryable: boolean };
}

export const api = {
  health: () => request<{ status: string; version: string }>("/health"),

  getProviders: () =>
    request<ProviderCapabilities>("/v1/import-wizard/capabilities/providers"),

  createSession: (name?: string) =>
    request<Session>("/v1/import-wizard/sessions", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  getSession: (id: string) =>
    request<Session>(`/v1/import-wizard/sessions/${id}`),

  getCpm: (sessionId: string) =>
    request<Record<string, unknown>>(`/v1/import-wizard/sessions/${sessionId}/cpm`),

  patchCpm: (sessionId: string, baseRevision: number, operations: unknown[]) =>
    request<PatchResult>(`/v1/import-wizard/sessions/${sessionId}/cpm/patch`, {
      method: "POST",
      body: JSON.stringify({ baseRevision, operations }),
    }),

  estimateAi: (sessionId: string, action: string, providerPolicy?: object) =>
    request<AiEstimate>(`/v1/import-wizard/sessions/${sessionId}/ai/estimate`, {
      method: "POST",
      body: JSON.stringify({ action, providerPolicy }),
    }),

  confirmAi: (sessionId: string, estimateId: string, action: string) =>
    request<{ accepted: boolean; action: string; executionId: string }>(
      `/v1/import-wizard/sessions/${sessionId}/ai/confirm`,
      {
        method: "POST",
        body: JSON.stringify({
          estimateId,
          action,
          userConfirmation: {
            confirmed: true,
            confirmedAt: new Date().toISOString(),
            actorType: "user",
          },
        }),
      }
    ),

  createPreviewJob: (sessionId: string, cpmRevision: number, settingsRevision: number, moderation?: object) =>
    request<Job>(`/v1/import-wizard/sessions/${sessionId}/preview-jobs`, {
      method: "POST",
      body: JSON.stringify({ cpmRevision, settingsRevision, moderation }),
    }),

  createCompileJob: (sessionId: string, cpmRevision: number, settingsRevision: number, mode?: string, moderation?: object) =>
    request<Job>(`/v1/import-wizard/sessions/${sessionId}/compile-jobs`, {
      method: "POST",
      body: JSON.stringify({ cpmRevision, settingsRevision, mode, moderation }),
    }),

  getJob: (sessionId: string, jobId: string) =>
    request<Job>(`/v1/import-wizard/sessions/${sessionId}/jobs/${jobId}`),
};
