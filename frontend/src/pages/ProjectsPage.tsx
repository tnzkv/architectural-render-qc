import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Project } from "../types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.listProjects().then(setProjects).finally(() => setLoading(false));
  }, []);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const project = await api.createProject(name.trim());
    setProjects((p) => [project, ...p]);
    setName("");
    navigate(`/projects/${project.id}`);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-4">Проєкти</h1>

      <form onSubmit={createProject} className="flex gap-2 mb-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Назва проєкту, напр. 29 East 64th St"
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + Новий проєкт
        </button>
      </form>

      {loading ? (
        <p className="text-slate-400 text-sm">Завантаження…</p>
      ) : projects.length === 0 ? (
        <p className="text-slate-400 text-sm">Проєктів ще немає. Створіть перший вище.</p>
      ) : (
        <ul className="divide-y border rounded-lg bg-white">
          {projects.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => navigate(`/projects/${p.id}`)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between"
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString()}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
