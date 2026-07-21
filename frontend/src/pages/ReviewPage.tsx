import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { AnalysisRun, Asset, Discrepancy, ElementType, Metrics, ReviewStatus, Taxonomy } from "../types";
import ImageCanvas from "../components/ImageCanvas";
import DiscrepancyCard from "../components/DiscrepancyCard";
import FilterBar from "../components/FilterBar";
import MetricsPanel from "../components/MetricsPanel";
import AddDiscrepancyModal from "../components/AddDiscrepancyModal";

export default function ReviewPage() {
  const { runId } = useParams();
  const rid = Number(runId);

  const [run, setRun] = useState<AnalysisRun | null>(null);
  const [renderAsset, setRenderAsset] = useState<Asset | null>(null);
  const [drawingAsset, setDrawingAsset] = useState<Asset | null>(null);
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [elementType, setElementType] = useState<ElementType | "">("");
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus | "">("");
  const [showAddModal, setShowAddModal] = useState(false);

  async function refreshDiscrepancies() {
    const [list, m] = await Promise.all([
      api.listDiscrepancies(rid, {
        element_type: elementType || undefined,
        review_status: reviewStatus || undefined,
      }),
      api.getMetrics(rid),
    ]);
    setDiscrepancies(list);
    setMetrics(m);
    if (!activeId && list[0]) setActiveId(list[0].id);
  }

  useEffect(() => {
    api.getTaxonomy().then(setTaxonomy);
    api.getRun(rid).then(async (r) => {
      setRun(r);
      const [render, drawing] = await Promise.all([
        api.getAsset(r.render_asset_id),
        api.getAsset(r.drawing_asset_id),
      ]);
      setRenderAsset(render);
      setDrawingAsset(drawing);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rid]);

  useEffect(() => {
    if (run) refreshDiscrepancies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, elementType, reviewStatus]);

  const activeIndex = useMemo(() => discrepancies.findIndex((d) => d.id === activeId), [discrepancies, activeId]);

  function goto(delta: number) {
    if (discrepancies.length === 0) return;
    const next = (activeIndex + delta + discrepancies.length) % discrepancies.length;
    setActiveId(discrepancies[next].id);
  }

  async function review(id: number, status: "tp" | "fp" | "fn") {
    const updated = await api.reviewDiscrepancy(id, status);
    setDiscrepancies((list) => list.map((d) => (d.id === id ? updated : d)));
    const m = await api.getMetrics(rid);
    setMetrics(m);
  }

  async function addManual(payload: { element_name: string; element_type: ElementType; error_type: any; description: string }) {
    const created = await api.addManualDiscrepancy(rid, payload);
    setDiscrepancies((list) => [...list, created]);
    setActiveId(created.id);
    setShowAddModal(false);
    const m = await api.getMetrics(rid);
    setMetrics(m);
  }

  if (!run) return <p className="text-slate-400 text-sm">Завантаження…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link to={`/projects/${run.project_id}`} className="text-xs text-slate-400 hover:underline">&larr; До проєкту</Link>
          <h1 className="text-xl font-semibold">Перевірка #{run.id}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddModal(true)} className="text-sm px-3 py-2 rounded-lg border bg-white hover:bg-slate-50">
            ➕ Додати пропущену помилку
          </button>
          <a href={api.exportUrl(run.id)} className="text-sm px-3 py-2 rounded-lg border bg-white hover:bg-slate-50">
            ⬇ Експорт CSV
          </a>
        </div>
      </div>

      <div className="mb-4">
        <MetricsPanel metrics={metrics} />
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr_360px] gap-4">
        <ImageCanvas
          src={drawingAsset ? api.assetUrl(drawingAsset) : null}
          label="Креслення"
          discrepancies={discrepancies}
          bboxKey="drawing_bbox"
          activeId={activeId}
          onSelect={setActiveId}
        />
        <ImageCanvas
          src={renderAsset ? api.assetUrl(renderAsset) : null}
          label="Рендер"
          discrepancies={discrepancies}
          bboxKey="render_bbox"
          activeId={activeId}
          onSelect={setActiveId}
        />

        <div>
          <FilterBar
            taxonomy={taxonomy}
            elementType={elementType}
            reviewStatus={reviewStatus}
            onElementType={setElementType}
            onReviewStatus={setReviewStatus}
          />

          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">{discrepancies.length} знайдено</span>
            <div className="flex gap-1">
              <button onClick={() => goto(-1)} className="text-xs px-2 py-1 border rounded-md bg-white hover:bg-slate-50">← Попередня</button>
              <button onClick={() => goto(1)} className="text-xs px-2 py-1 border rounded-md bg-white hover:bg-slate-50">Наступна →</button>
            </div>
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {discrepancies.map((d) => (
              <DiscrepancyCard
                key={d.id}
                d={d}
                active={d.id === activeId}
                onSelect={() => setActiveId(d.id)}
                onReview={(status) => review(d.id, status)}
              />
            ))}
            {discrepancies.length === 0 && (
              <p className="text-sm text-slate-400">Немає результатів за поточними фільтрами.</p>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddDiscrepancyModal taxonomy={taxonomy} onClose={() => setShowAddModal(false)} onSubmit={addManual} />
      )}
    </div>
  );
}
