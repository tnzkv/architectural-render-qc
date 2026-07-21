import { NavLink, Outlet } from "react-router-dom";

const navItem = "px-3 py-2 rounded-lg text-sm font-medium transition-colors";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
          <div className="font-semibold text-lg text-brand-700">Render QC</div>
          <nav className="flex gap-1">
            <NavLink to="/" end className={({ isActive }) => `${navItem} ${isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"}`}>
              Проєкти
            </NavLink>
          </nav>
          <div className="ml-auto text-xs text-slate-400">MVP · mock AI pipeline</div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
