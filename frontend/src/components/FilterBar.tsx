import type { ElementType, ReviewStatus, Taxonomy } from "../types";
import { STATUS_LABEL } from "./statusColors";

export default function FilterBar({
  taxonomy, elementType, reviewStatus, onElementType, onReviewStatus,
}: {
  taxonomy: Taxonomy | null;
  elementType: ElementType | "" ;
  reviewStatus: ReviewStatus | "";
  onElementType: (v: ElementType | "") => void;
  onReviewStatus: (v: ReviewStatus | "") => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      <select
        value={elementType}
        onChange={(e) => onElementType(e.target.value as ElementType | "")}
        className="text-xs border rounded-lg px-2 py-1.5 bg-white"
      >
        <option value="">Усі типи елементів</option>
        {taxonomy?.element_types.map((t) => (
          <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
        ))}
      </select>

      <select
        value={reviewStatus}
        onChange={(e) => onReviewStatus(e.target.value as ReviewStatus | "")}
        className="text-xs border rounded-lg px-2 py-1.5 bg-white"
      >
        <option value="">Усі статуси</option>
        {(["unreviewed", "tp", "fp", "fn"] as ReviewStatus[]).map((s) => (
          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
        ))}
      </select>
    </div>
  );
}
