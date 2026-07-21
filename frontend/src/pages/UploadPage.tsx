import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import type { Asset, Project } from "../types";

function AssetPicker({
  title, kind, assets, selected, onSelect, onUpload, uploading,
}: {
  title: string;
  kind: "render" | "drawing";
  assets: Asset[];
  selected: number | null;
  onSelect: (id: number) => void;
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  return (
    <div className="border rounded-lg bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">{title}</h3>
        <label className="text-xs text-brand-600 hover:underline cursor-pointer">
          {uploading ? "Завантаження…" : "+ Завантажити"}
          <input
            type="file"
            accept="image/*,.pdf,.dwg"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {assets.length === 0 ? (
        <p className="text-sm text-slate-400">
          {kind === "render" ? "Немає завантажених рендерів." : "Немає завантажених креслень."}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {assets.map((a) => (
            <button
              key={a.id}
              onClick={() => onSelect(a.id)}
              className={`border rounded-lg overflow-hidden text-left ${selected === a.id ? "ring-2 ring-brand-600" : ""}`}
            >
              {a.stored_filename.match(/\.(png|jpe?g|webp)$/i) ? (
                <img src={api.assetUrl(a)} alt={a.original_filename} className="h-20 w-full object-cover" />
              ) : (
                <div className="h-20 w-full bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                  {a.stored_filename.split(".").pop()?.toUpperCase()}
                </div>
              )}
              <div className="px-2 py-1 text-xs truncate">{a.original_filename}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UploadPage() {
  const { projectId } = useParams();
  const pid = Number(projectId);
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [renders, setRenders] = useState<Asset[]>([]);
  const [drawings, setDrawings] = useState<Asset[]>([]);
  const [selectedRender, setSelectedRender] = useState<number | null>(null);
  const [selectedDrawing, setSelectedDrawing] = useState<number | null>(null);
  const [uploading, setUploading] = useState<"render" | "drawing" | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [r, d] = await Promise.all([
      api.listAssets(pid, "render"),
      api.listAssets(pid, "drawing"),
    ]);
    setRenders(r);
    setDrawings(d);
    if (!selectedRender && r[0]) setSelectedRender(r[0].id);
    if (!selectedDrawing && d[0]) setSelectedDrawing(d[0].id);
  }

  useEffect(() => {
    api.getProject(pid).then(setProject);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  async function handleUpload(kind: "render" | "drawing", file: File) {
    setUploading(kind);
    setError(null);
    try {
      const asset = await api.uploadAsset(pid, kind, file);
      if (kind === "render") {
        setRenders((r) => [asset, ...r]);
        setSelectedRender(asset.id);
      } else {
        setDrawings((d) => [asset, ...d]);
        setSelectedDrawing(asset.id);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setUploading(null);
    }
  }

  async function runAnalysis() {
    if (!selectedRender || !selectedDrawing) return;
    setAnalyzing(true);
    setError(null);
    try {
      const run = await api.createRun(pid, selectedRender, selectedDrawing);
      navigate(`/runs/${run.id}`);
    } catch (e) {
      setError(String(e));
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link to="/" className="text-xs text-slate-400 hover:underline">&larr; Проєкти</Link>
          <h1 className="text-xl font-semibold">{project?.name ?? "…"}</h1>
        </div>
        <Link to={`/projects/${pid}/history`} className="text-sm text-brand-600 hover:underline">
          Історія перевірок
        </Link>
      </div>

      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <AssetPicker
          title="Рендери"
          kind="render"
          assets={renders}
          selected={selectedRender}
          onSelect={setSelectedRender}
          onUpload={(f) => handleUpload("render", f)}
          uploading={uploading === "render"}
        />
        <AssetPicker
          title="Креслення (DWG / PDF / PNG / JPG)"
          kind="drawing"
          assets={drawings}
          selected={selectedDrawing}
          onSelect={setSelectedDrawing}
          onUpload={(f) => handleUpload("drawing", f)}
          uploading={uploading === "drawing"}
        />
      </div>

      <button
        onClick={runAnalysis}
        disabled={!selectedRender || !selectedDrawing || analyzing}
        className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-medium px-5 py-2.5 rounded-lg text-sm"
      >
        {analyzing ? "Аналізуємо…" : "Запустити перевірку відповідності"}
      </button>
    </div>
  );
}
