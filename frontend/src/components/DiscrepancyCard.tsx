import type { Discrepancy } from "../types";
import { STATUS_COLOR, STATUS_LABEL, ERROR_TYPE_LABEL } from "./statusColors";

export default function DiscrepancyCard({
  d, active, onSelect, onReview,
}: {
  d: Discrepancy;
  active: boolean;
  onSelect: () => void;
  onReview: (status: "tp" | "fp" | "fn") => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`border rounded-lg p-3 cursor-pointer transition-colors ${active ? "border-brand-500 bg-brand-50" : "bg-white hover:bg-slate-50"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium text-sm">{d.element_name}</div>
          <div className="text-xs text-slate-500">{ERROR_TYPE_LABEL[d.error_type] ?? d.error_type}</div>
        </div>
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{ color: STATUS_COLOR[d.review_status], backgroundColor: `${STATUS_COLOR[d.review_status]}1a` }}
        >
          {STATUS_LABEL[d.review_status]}
        </span>
      </div>

      <p className="text-xs text-slate-600 mt-2">{d.description}</p>

      <div className="flex items-center justify-between mt-3">
        <span className="text-[11px] text-slate-400">
          {d.is_user_added ? "додано вручну" : `Впевненість: ${Math.round(d.confidence * 100)}%`}
        </span>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            title="True Positive — AI правильно знайшов помилку"
            onClick={() => onReview("tp")}
            className={`w-7 h-7 rounded-md text-sm ${d.review_status === "tp" ? "bg-green-600 text-white" : "bg-green-50 text-green-700 hover:bg-green-100"}`}
          >
            ✅
          </button>
          <button
            title="False Positive — AI помилково знайшов помилку"
            onClick={() => onReview("fp")}
            className={`w-7 h-7 rounded-md text-sm ${d.review_status === "fp" ? "bg-red-600 text-white" : "bg-red-50 text-red-700 hover:bg-red-100"}`}
          >
            ❌
          </button>
        </div>
      </div>
    </div>
  );
}
