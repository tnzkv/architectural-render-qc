import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { AnalysisRun, Metrics, Project } from "../types";

export default function HistoryPage() {
  const { projectId } = useParams();
  const pid = Number(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [runs, setRuns] = useState<AnalysisRun[]>([]);
  const [metricsByRun, setMetricsByRun] = useState<Record<number, Metrics>>({});

  useEffect(() => {
    api.getProject(pid).then(setProject);
    api.history(pid).then(async (list) => {
      setRuns(list);
      const entries = await Promise.all(list.map(async (r) => [r.id, await api.getMetrics(r.id)] as const));
      setMetricsByRun(Object.fromEntries(entries));
    });
  }, [pid]);

  return (
    <div>
      <div className="mb-4">
        <Link to={`/projects/${pid}`} className="text-xs text-slate-400 hover:underline">&larr; До проєкту</Link>
        <h1 className="text-xl font-semibold">Історія перевірок — {project?.name}</h1>
      </div>

      {runs.length === 0 ? (
        <p className="text-sm text-slate-400">Перевірок ще не було.</p>
      ) : (
        <div className="border rounded-lg bg-white divide-y">
          <div className="grid grid-cols-6 gap-2 px-4 py-2 text-[11px] font-medium text-slate-400 uppercase">
            <span>Перевірка</span>
            <span>Дата</span>
            <span>Precision</span>
            <span>Recall</span>
            <span>F1</span>
            <span>TP / FP / FN</span>
          </div>
          {runs.map((r) => {
            const m = metricsByRun[r.id];
            return (
              <Link
                key={r.id}
                to={`/runs/${r.id}`}
                className="grid grid-cols-6 gap-2 px-4 py-3 text-sm hover:bg-slate-50"
              >
                <span className="font-medium">#{r.id}</span>
                <span className="text-slate-500">{new Date(r.created_at).toLocaleString()}</span>
                <span>{m ? m.precision.toFixed(2) : "…"}</span>
                <span>{m ? m.recall.toFixed(2) : "…"}</span>
                <span>{m ? m.f1.toFixed(2) : "…"}</span>
                <span className="text-slate-500">{m ? `${m.tp} / ${m.fp} / ${m.fn}` : "…"}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
