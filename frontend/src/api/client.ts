import type {
  Project, Asset, AnalysisRun, Discrepancy, Metrics, Taxonomy, BBox, ElementType, ErrorType,
} from "../types";

const BASE = "/api";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: init?.body instanceof FormData ? init.headers : { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${text}`);
  }
  return res.json();
}

export const api = {
  listProjects: () => req<Project[]>("/projects"),
  createProject: (name: string) => req<Project>("/projects", { method: "POST", body: JSON.stringify({ name }) }),
  getProject: (id: number) => req<Project>(`/projects/${id}`),
  history: (projectId: number) => req<AnalysisRun[]>(`/projects/${projectId}/history`),

  listAssets: (projectId: number, kind?: "render" | "drawing") =>
    req<Asset[]>(`/projects/${projectId}/assets${kind ? `?kind=${kind}` : ""}`),
  uploadAsset: (projectId: number, kind: "render" | "drawing", file: File) => {
    const form = new FormData();
    form.append("kind", kind);
    form.append("file", file);
    return req<Asset>(`/projects/${projectId}/assets`, { method: "POST", body: form });
  },
  assetUrl: (asset: Asset) => `/uploads/${asset.stored_filename}`,
  getAsset: (id: number) => req<Asset>(`/assets/${id}`),

  createRun: (projectId: number, renderAssetId: number, drawingAssetId: number) =>
    req<AnalysisRun>(`/projects/${projectId}/analysis`, {
      method: "POST",
      body: JSON.stringify({ render_asset_id: renderAssetId, drawing_asset_id: drawingAssetId }),
    }),
  getRun: (runId: number) => req<AnalysisRun>(`/runs/${runId}`),

  listDiscrepancies: (runId: number, filters?: { element_type?: ElementType; review_status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.element_type) params.set("element_type", filters.element_type);
    if (filters?.review_status) params.set("review_status", filters.review_status);
    const qs = params.toString();
    return req<Discrepancy[]>(`/runs/${runId}/discrepancies${qs ? `?${qs}` : ""}`);
  },
  reviewDiscrepancy: (id: number, review_status: "tp" | "fp" | "fn") =>
    req<Discrepancy>(`/discrepancies/${id}`, { method: "PATCH", body: JSON.stringify({ review_status }) }),
  addManualDiscrepancy: (runId: number, payload: {
    element_name: string; element_type: ElementType; error_type: ErrorType;
    description: string; drawing_bbox?: BBox | null; render_bbox?: BBox | null;
  }) => req<Discrepancy>(`/runs/${runId}/discrepancies`, { method: "POST", body: JSON.stringify(payload) }),

  getMetrics: (runId: number) => req<Metrics>(`/runs/${runId}/metrics`),
  exportUrl: (runId: number) => `${BASE}/runs/${runId}/export`,

  getTaxonomy: () => req<Taxonomy>("/meta/taxonomy"),
};
