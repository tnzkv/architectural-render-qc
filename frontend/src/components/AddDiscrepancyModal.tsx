import { useState } from "react";
import type { ElementType, ErrorType, Taxonomy } from "../types";
import { ERROR_TYPE_LABEL } from "./statusColors";

export default function AddDiscrepancyModal({
  taxonomy, onClose, onSubmit,
}: {
  taxonomy: Taxonomy | null;
  onClose: () => void;
  onSubmit: (payload: { element_name: string; element_type: ElementType; error_type: ErrorType; description: string }) => void;
}) {
  const [elementName, setElementName] = useState("");
  const [elementType, setElementType] = useState<ElementType>(taxonomy?.element_types[0] ?? "window");
  const [errorType, setErrorType] = useState<ErrorType>(taxonomy?.error_types[0] ?? "missing");
  const [description, setDescription] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!elementName.trim() || !description.trim()) return;
    onSubmit({ element_name: elementName.trim(), element_type: elementType, error_type: errorType, description: description.trim() });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5">
        <h3 className="font-semibold mb-1">➕ Додати пропущену AI помилку (FN)</h3>
        <p className="text-xs text-slate-500 mb-4">Ви знайшли невідповідність, яку AI не виявив.</p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs text-slate-500">Назва елемента</label>
            <input value={elementName} onChange={(e) => setElementName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="напр. Window W-07" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Тип елемента</label>
              <select value={elementType} onChange={(e) => setElementType(e.target.value as ElementType)} className="w-full border rounded-lg px-2 py-2 text-sm mt-1">
                {taxonomy?.element_types.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Тип помилки</label>
              <select value={errorType} onChange={(e) => setErrorType(e.target.value as ErrorType)} className="w-full border rounded-lg px-2 py-2 text-sm mt-1">
                {taxonomy?.error_types.map((t) => <option key={t} value={t}>{ERROR_TYPE_LABEL[t] ?? t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500">Опис</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="Що саме не відповідає кресленню?" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="text-sm px-4 py-2 rounded-lg border">Скасувати</button>
            <button type="submit" className="text-sm px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700">Додати як FN</button>
          </div>
        </form>
      </div>
    </div>
  );
}
