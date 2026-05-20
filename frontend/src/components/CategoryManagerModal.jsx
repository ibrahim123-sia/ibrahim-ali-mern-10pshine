import { useEffect, useState } from "react";
import { X, Plus, Pencil, Trash2, Check } from "lucide-react";
import { useAppContext } from "../context/context.jsx";

const COLOR_OPTIONS = [
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#10b981", // emerald
  "#ec4899", // pink
  "#a855f7", // purple
  "#ef4444", // red
  "#14b8a6", // teal
  "#64748b", // slate
];

const CategoryManagerModal = ({ open, onClose }) => {
  const { categories, createCategory, updateCategory, deleteCategory } = useAppContext();
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingColor, setEditingColor] = useState(COLOR_OPTIONS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setColor(COLOR_OPTIONS[0]);
    setEditingId(null);
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      await createCategory({ name: trimmed, color });
      setName("");
    } catch (err) {
      setError(err.message || "Failed to create category");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat._id);
    setEditingName(cat.name);
    setEditingColor(cat.color || COLOR_OPTIONS[0]);
    setError(null);
  };

  const handleSaveEdit = async (id) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      await updateCategory(id, { name: trimmed, color: editingColor });
      setEditingId(null);
    } catch (err) {
      setError(err.message || "Failed to update category");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category? Notes will keep their content but lose this category.")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteCategory(id);
    } catch (err) {
      setError(err.message || "Failed to delete category");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-white dark:bg-stone-800 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-700">
          <h2
            className="text-xl text-stone-800 dark:text-stone-100"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Manage categories
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-700"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Create form */}
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                New category name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Study, Work, Ideas"
                className="w-full px-3 py-2 text-sm bg-amber-50/40 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-stone-800 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition ${
                      color === c
                        ? "border-stone-400 dark:border-stone-200 scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 rounded-lg transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add category
            </button>
          </form>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* List */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
              Your categories ({categories.length})
            </h3>
            {categories.length === 0 ? (
              <p className="text-sm text-stone-400 italic">
                You haven't created any categories yet.
              </p>
            ) : (
              <ul className="space-y-1">
                {categories.map((cat) => (
                  <li
                    key={cat._id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700/50"
                  >
                    {editingId === cat._id ? (
                      <>
                        <div className="flex flex-wrap gap-1 mr-1">
                          {COLOR_OPTIONS.map((c) => (
                            <button
                              type="button"
                              key={c}
                              onClick={() => setEditingColor(c)}
                              className={`w-4 h-4 rounded-full border-2 transition ${
                                editingColor === c
                                  ? "border-stone-400 dark:border-stone-200"
                                  : "border-transparent"
                              }`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          autoFocus
                          className="flex-1 min-w-0 px-2 py-1 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-800 dark:text-stone-100"
                        />
                        <button
                          onClick={() => handleSaveEdit(cat._id)}
                          disabled={busy}
                          className="p-1.5 rounded text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                          aria-label="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 rounded text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700"
                          aria-label="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color || "#f59e0b" }}
                        />
                        <span className="flex-1 text-sm text-stone-800 dark:text-stone-100 truncate">
                          {cat.name}
                        </span>
                        <button
                          onClick={() => startEdit(cat)}
                          className="p-1.5 rounded text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700"
                          aria-label="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat._id)}
                          disabled={busy}
                          className="p-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagerModal;
