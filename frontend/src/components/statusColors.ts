import type { ReviewStatus } from "../types";

export const STATUS_COLOR: Record<ReviewStatus, string> = {
  unreviewed: "#f59e0b", // amber
  tp: "#16a34a",         // green
  fp: "#dc2626",         // red
  fn: "#7c3aed",         // purple (manually added / confirmed missed)
};

export const STATUS_LABEL: Record<ReviewStatus, string> = {
  unreviewed: "Не перевірено",
  tp: "TP · підтверджено",
  fp: "FP · хибне спрацювання",
  fn: "FN · пропущено AI",
};

export const ERROR_TYPE_LABEL: Record<string, string> = {
  missing: "Відсутній елемент",
  extra: "Зайвий елемент",
  wrong_type: "Невірний тип",
  orientation_mismatch: "Невірна орієнтація/напрямок",
  count_mismatch: "Невірна кількість секцій",
  design_mismatch: "Невідповідність дизайну",
};
