import type { Discrepancy } from "../types";
import { STATUS_COLOR } from "./statusColors";

export default function ImageCanvas({
  src, label, discrepancies, bboxKey, activeId, onSelect,
}: {
  src: string | null;
  label: string;
  discrepancies: Discrepancy[];
  bboxKey: "render_bbox" | "drawing_bbox";
  activeId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <div className="px-3 py-2 text-xs font-medium text-slate-500 border-b bg-slate-50">{label}</div>
      <div className="relative bg-slate-100">
        {src ? <img src={src} alt={label} className="w-full h-auto block" /> : (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Немає зображення</div>
        )}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {discrepancies.map((d) => {
            const box = d[bboxKey];
            if (!box) return null;
            const isActive = d.id === activeId;
            const color = STATUS_COLOR[d.review_status];
            return (
              <rect
                key={d.id}
                x={box.x * 100}
                y={box.y * 100}
                width={box.w * 100}
                height={box.h * 100}
                fill={isActive ? `${color}33` : "transparent"}
                stroke={color}
                strokeWidth={isActive ? 1.2 : 0.6}
                vectorEffect="non-scaling-stroke"
                className="cursor-pointer"
                onClick={() => onSelect(d.id)}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
