import type { Metrics } from "../types";

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="text-center">
      <div className={`text-lg font-semibold ${tone ?? "text-slate-800"}`}>{value}</div>
      <div className="text-[11px] text-slate-400">{label}</div>
    </div>
  );
}

export default function MetricsPanel({ metrics }: { metrics: Metrics | null }) {
  if (!metrics) return null;
  return (
    <div className="border rounded-lg bg-white p-4 grid grid-cols-3 sm:grid-cols-6 gap-3">
      <Stat label="Precision" value={metrics.precision.toFixed(2)} tone="text-brand-700" />
      <Stat label="Recall" value={metrics.recall.toFixed(2)} tone="text-brand-700" />
      <Stat label="F1-score" value={metrics.f1.toFixed(2)} tone="text-brand-700" />
      <Stat label="TP" value={metrics.tp} tone="text-green-600" />
      <Stat label="FP" value={metrics.fp} tone="text-red-600" />
      <Stat label="FN" value={metrics.fn} tone="text-purple-600" />
    </div>
  );
}
