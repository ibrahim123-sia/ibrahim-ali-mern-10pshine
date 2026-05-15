import { useEffect, useMemo, useRef, useState } from "react";
import { X, Pin, Star, ChevronDown, Check } from "lucide-react";
import { useAppContext } from "../context/context.jsx";
import TagInput from "./TagInput.jsx";

const CategorySelect = ({ value, onChange, categories, onManage }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = categories.find((c) => c._id === value);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm bg-amber-50/40 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 hover:border-amber-300 transition text-left"
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected ? (
            <>
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: selected.color || "#f59e0b" }}
              />
              <span className="truncate text-stone-800 dark:text-stone-100">
                {selected.name}
              </span>
            </>
          ) : (
            <span className="text-stone-400">No category</span>
          )}
        </span>
        <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-20 left-0 right-0 mt-1 p-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg animate-fade-in max-h-60 overflow-y-auto">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded"
          >
            <span className="text-stone-500 italic">No category</span>
            {!value && <Check className="w-3.5 h-3.5 text-amber-600" />}
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              onClick={() => {
                onChange(cat._id);
                setOpen(false);
              }}
              className="w-full flex items-center justify-between gap-2 px-2 py-1.5 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color || "#f59e0b" }}
                />
                <span className="truncate">{cat.name}</span>
              </span>
              {value === cat._id && (
                <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              )}
            </button>
          ))}
          {onManage && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onManage();
              }}
              className="w-full text-left px-2 py-1.5 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded mt-1 border-t border-stone-100 dark:border-stone-700"
            >
              + Manage categories
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const NoteEditorModal = ({ open, mode = "create", note, onClose, onManageCategories }) => {
  const { createNote, updateNote, categories, notes } = useAppContext();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(null);
  const [tags, setTags] = useState([]);
  const [pinned, setPinned] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const titleRef = useRef(null);

  // Tag suggestions from all existing notes' tags
  const tagSuggestions = useMemo(() => {
    const set = new Set();
    for (const n of notes || []) {
      for (const t of n.tags || []) set.add(t);
    }
    return Array.from(set).sort();
  }, [notes]);

  useEffect(() => {
    if (!open) return;
    setTitle(note?.title || "");
    setContent(note?.content || "");
    setCategory(note?.category || null);
    setTags(note?.tags || []);
    setPinned(!!note?.pinned);
    setFavorite(!!note?.favorite);
    setError(null);
    setSaving(false);
    setTimeout(() => titleRef.current?.focus(), 50);
  }, [open, note]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle && !trimmedContent) {
      setError("A title or some content is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      title: trimmedTitle || "Untitled",
      content: trimmedContent,
      category,
      tags,
      pinned,
      favorite,
    };
    try {
      if (mode === "edit" && note?._id) {
        await updateNote(note._id, payload);
      } else {
        await createNote(payload);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-stone-800 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-700">
          <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            {mode === "edit" ? "Edit Note" : "New Note"}
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPinned((v) => !v)}
              className={`p-1.5 rounded transition ${
                pinned
                  ? "text-amber-600 bg-amber-50 dark:bg-amber-900/30"
                  : "text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700"
              }`}
              title={pinned ? "Unpin" : "Pin"}
              aria-pressed={pinned}
            >
              <Pin className={`w-4 h-4 ${pinned ? "fill-amber-600" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => setFavorite((v) => !v)}
              className={`p-1.5 rounded transition ${
                favorite
                  ? "text-amber-500 bg-amber-50 dark:bg-amber-900/30"
                  : "text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700"
              }`}
              title={favorite ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={favorite}
            >
              <Star className={`w-4 h-4 ${favorite ? "fill-amber-500" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-700 ml-1"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-stone-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="w-full text-2xl font-semibold bg-transparent border-0 focus:outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-600"
            style={{ fontFamily: "Georgia, serif" }}
          />

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                Category
              </label>
              <CategorySelect
                value={category}
                onChange={setCategory}
                categories={categories}
                onManage={onManageCategories}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                Tags
              </label>
              <TagInput
                value={tags}
                onChange={setTags}
                suggestions={tagSuggestions}
              />
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing…"
            rows={12}
            className="w-full bg-transparent border-0 focus:outline-none resize-none text-stone-700 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-600 leading-relaxed"
          />
          {error && (
            <div className="text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/40 rounded-b-2xl">
          <p className="text-xs text-stone-400 dark:text-stone-500">
            Rich formatting comes in a separate PR
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 rounded-lg shadow-sm transition"
            >
              {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Create note"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditorModal;
