import type {
  MelbourneSummary,
  ModelInfo,
  RegionalSummary,
  ReplayState,
  ResearchPredictionInput,
  ResearchPredictionOutput,
  TwinFrame,
  TwinSummary,
} from "../types";

const API_BASE = "";
export const STREAM_URL = `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/ws/twin`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  getModelInfo: () => request<ModelInfo>("/api/research/model"),
  getMelbourneSummary: () =>
    request<MelbourneSummary>("/api/research/melbourne"),
  getRegionalSummary: () => request<RegionalSummary>("/api/regional/summary"),
  getTwinSummary: () => request<TwinSummary>("/api/twin/summary"),
  getTwinSnapshot: () => request<TwinFrame>("/api/twin/snapshot"),
  predict: (payload: ResearchPredictionInput) =>
    request<ResearchPredictionOutput>("/api/research/predict", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  controlReplay: (payload: {
    action?: "play" | "pause" | "reset" | "step";
    speed?: number;
  }) =>
    request<ReplayState>("/api/twin/control", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
