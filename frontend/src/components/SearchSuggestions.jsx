import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Clock, FileText, Folder, Hash, X } from "lucide-react";
import { stripHtml } from "../utils/formatTime.js";

const RECENT_KEY = "nowrite-recent-searches";
const RECENT_MAX = 6;

const readRecent = () => {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

const writeRecent = (list) => {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
  } catch {
    /* localStorage may be disabled */
  }
};

export const recordSearch = (q) => {
  const trimmed = q.trim();
  if (!trimmed) return;
  const list = readRecent();
  const next = [trimmed, ...list.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())];
  writeRecent(next);
};

const SearchSuggestions = ({
  query,
  notes = [],
  categories = [],
  onPickNote,
  onPickCategory,
  onPickTag,
  onPickRecent,
  onClose,
}) => {
  const [recents, setRecents] = useState(() => readRecent());
  const ref = useRef(null);

  useEffect(() => {
    setRecents(readRecent());
  }, [query]);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onClose]);

  const q = query.trim().toLowerCase();

  const matchedNotes = useMemo(() => {
    if (!q) return [];
    return notes
      .filter((n) => !n.deletedAt)
      .filter((n) => {
        if ((n.title || "").toLowerCase().includes(q)) return true;
        if (stripHtml(n.content || "").toLowerCase().includes(q)) return true;
        return false;
      })
      .slice(0, 5);
  }, [notes, q]);

  const matchedCategories = useMemo(() => {
    if (!q) return [];
    return categories
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 4);
  }, [categories, q]);

  const matchedTags = useMemo(() => {
    if (!q) return [];
    const set = new Set();
    for (const n of notes) {
      if (n.deletedAt) continue;
      for (const t of n.tags || []) {
        if (t.includes(q)) set.add(t);
      }
    }
    return Array.from(set).slice(0, 6);
  }, [notes, q]);

  const hasResults =
    matchedNotes.length || matchedCategories.length || matchedTags.length;
  const showRecents = !q && recents.length > 0;

  if (!showRecents && !hasResults) return null;

  const clearRecents = () => {
    writeRecent([]);
    setRecents([]);
  };

  return (
    <div
      ref={ref}
      className="absolute z-30 left-0 right-0 mt-1 p-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-xl animate-fade-in max-h-96 overflow-y-auto"
    >
      {showRecents && (
        <div>
          <div className="flex items-center justify-between px-2 pt-1.5 pb-1">
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
              <Clock className="w-3 h-3" /> Recent searches
            </span>
            <button
              onClick={clearRecents}
              className="text-[10px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 inline-flex items-center gap-0.5"
              title="Clear recent searches"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          </div>
          {recents.map((r) => (
            <button
              key={r}
              onClick={() => onPickRecent?.(r)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-left"
            >
              <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="truncate">{r}</span>
            </button>
          ))}
        </div>
      )}

      {matchedNotes.length > 0 && (
        <div className="mt-1">
          <span className="block px-2 py-1 text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Notes
          </span>
          {matchedNotes.map((n) => (
            <button
              key={n._id}
              onClick={() => onPickNote?.(n)}
              className="w-full flex items-start gap-2 px-2 py-1.5 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-left"
            >
              <FileText className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{n.title || "Untitled"}</div>
                <div className="truncate text-xs text-stone-500 dark:text-stone-400">
                  {stripHtml(n.content || "").slice(0, 80)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {matchedCategories.length > 0 && (
        <div className="mt-1">
          <span className="block px-2 py-1 text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Categories
          </span>
          {matchedCategories.map((c) => (
            <button
              key={c._id}
              onClick={() => onPickCategory?.(c)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-left"
            >
              <Folder className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: c.color || "#f59e0b" }}
              />
              <span className="truncate">{c.name}</span>
            </button>
          ))}
        </div>
      )}

      {matchedTags.length > 0 && (
        <div className="mt-1 px-2 py-1.5">
          <span className="block text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
            Tags
          </span>
          <div className="flex flex-wrap gap-1">
            {matchedTags.map((t) => (
              <button
                key={t}
                onClick={() => onPickTag?.(t)}
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60"
              >
                <Hash className="w-3 h-3" /> {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;
