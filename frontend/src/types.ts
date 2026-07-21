export type ElementType =
  | "window" | "door" | "garage_door" | "roof" | "roof_section"
  | "dormer_window" | "balcony" | "column" | "railing" | "stairs"
  | "canopy" | "terrace" | "facade_decor" | "exterior_light"
  | "gutter" | "downspout" | "chimney" | "other";

export type ErrorType =
  | "missing" | "extra" | "wrong_type" | "orientation_mismatch"
  | "count_mismatch" | "design_mismatch";

export type ReviewStatus = "unreviewed" | "tp" | "fp" | "fn";

export interface Project {
  id: number;
  name: string;
  created_at: string;
}

export interface Asset {
  id: number;
  project_id: number;
  kind: "render" | "drawing";
  original_filename: string;
  stored_filename: string;
  uploaded_at: string;
}

export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Discrepancy {
  id: number;
  run_id: number;
  element_name: string;
  element_type: ElementType;
  error_type: ErrorType;
  description: string;
  confidence: number;
  drawing_bbox: BBox | null;
  render_bbox: BBox | null;
  review_status: ReviewStatus;
  is_user_added: boolean;
  created_at: string;
}

export interface AnalysisRun {
  id: number;
  project_id: number;
  render_asset_id: number;
  drawing_asset_id: number;
  status: string;
  created_at: string;
  discrepancies: Discrepancy[];
}

export interface Metrics {
  tp: number;
  fp: number;
  fn: number;
  precision: number;
  recall: number;
  f1: number;
  unreviewed: number;
  total: number;
}

export interface Taxonomy {
  element_types: ElementType[];
  error_types: ErrorType[];
  review_statuses: ReviewStatus[];
}
