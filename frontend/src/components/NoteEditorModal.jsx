import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Pin,
  Star,
  ChevronDown,
  Check,
  Palette,
  ChevronUp,
} from "lucide-react";
import { useAppContext } from "../context/context.jsx";
import TagInput from "./TagInput.jsx";
import ColorPicker from "./customization/ColorPicker.jsx";
import FontPicker, { FONT_FAMILY_MAP } from "./customization/FontPicker.jsx";
import MoodPicker from "./customization/MoodPicker.jsx";
import ChecklistEditor from "./customization/ChecklistEditor.jsx";
import AutoSaveIndicator from "./customization/AutoSaveIndicator.jsx";

const NOTE_COLOR_OPTIONS = [
  "#fef3c7", // amber-100
  "#fee2e2", // red-100
  "#fce7f3", // pink-100
  "#ddd6fe", // violet-200
  "#dbeafe", // blue-100
  "#d1fae5", // emerald-100
  "#fef9c3", // yellow-100
  "#e7e5e4", // stone-200
];
const TEXT_COLOR_OPTIONS = [
  "#1c1917", // stone-900
  "#7c2d12", // orange-900
  "#9f1239", // rose-800
  "#581c87", // purple-900
  "#1e3a8a", // blue-900
  "#064e3b", // emerald-900
  "#365314", // lime-900
  "#44403c", // stone-700
];

const AUTOSAVE_DEBOUNCE_MS = 1200;

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
  const [noteColor, setNoteColor] = useState("");
  const [textColor, setTextColor] = useState("");
  const [fontStyle, setFontStyle] = useState("sans");
  const [checklist, setChecklist] = useState([]);
  const [moodLabel, setMoodLabel] = useState("");
  const [showCustomize, setShowCustomize] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState("idle");
  const [autoSaveError, setAutoSaveError] = useState(null);

  const titleRef = useRef(null);
  const autosaveTimer = useRef(null);
  const savedStatusTimer = useRef(null);
  const noteIdRef = useRef(null);
  const initialLoadRef = useRef(true);

  const tagSuggestions = useMemo(() => {
    const set = new Set();
    for (const n of notes || []) {
      for (const t of n.tags || []) set.add(t);
    }
    return Array.from(set).sort();
  }, [notes]);

  useEffect(() => {
    if (!open) return;
    initialLoadRef.current = true;
    noteIdRef.current = note?._id || null;
    setTitle(note?.title || "");
    setContent(note?.content || "");
    setCategory(note?.category || null);
    setTags(note?.tags || []);
    setPinned(!!note?.pinned);
    setFavorite(!!note?.favorite);
    setNoteColor(note?.noteColor || "");
    setTextColor(note?.textColor || "");
    setFontStyle(note?.fontStyle || "sans");
    setChecklist(note?.checklist || []);
    setMoodLabel(note?.moodLabel || "");
    setShowCustomize(false);
    setError(null);
    setSaving(false);
    setAutoSaveStatus("idle");
    setAutoSaveError(null);
    setTimeout(() => {
      titleRef.current?.focus();
      initialLoadRef.current = false;
    }, 50);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      if (savedStatusTimer.current) clearTimeout(savedStatusTimer.current);
    };
  }, [open, note]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const buildPayload = useCallback(
    () => ({
      title: title.trim() || "Untitled",
      content: content.trim(),
      category,
      tags,
      pinned,
      favorite,
      noteColor,
      textColor,
      fontStyle,
      checklist: checklist.filter((i) => i.text.trim().length > 0 || i.done),
      moodLabel,
    }),
    [
      title,
      content,
      category,
      tags,
      pinned,
      favorite,
      noteColor,
      textColor,
      fontStyle,
      checklist,
      moodLabel,
    ]
  );

  // Auto-save: only in edit mode, only after the initial form-load completes
  useEffect(() => {
    if (!open) return;
    if (mode !== "edit" || !noteIdRef.current) return;
    if (initialLoadRef.current) return;

    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      const trimmedTitle = title.trim();
      const trimmedContent = content.trim();
      if (!trimmedTitle && !trimmedContent && checklist.length === 0) return;
      setAutoSaveStatus("saving");
      setAutoSaveError(null);
      try {
        await updateNote(noteIdRef.current, buildPayload());
        setAutoSaveStatus("saved");
        if (savedStatusTimer.current) clearTimeout(savedStatusTimer.current);
        savedStatusTimer.current = setTimeout(() => setAutoSaveStatus("idle"), 1800);
      } catch (err) {
        setAutoSaveStatus("error");
        setAutoSaveError(err?.message || "Save failed");
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [
    open,
    mode,
    title,
    content,
    category,
    tags,
    pinned,
    favorite,
    noteColor,
    textColor,
    fontStyle,
    checklist,
    moodLabel,
    buildPayload,
    updateNote,
  ]);

  if (!open) return null;

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle && !trimmedContent && checklist.length === 0) {
      setError("A title, some content, or a checklist item is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (mode === "edit" && note?._id) {
        await updateNote(note._id, buildPayload());
      } else {
        await createNote(buildPayload());
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const fontFamily = FONT_FAMILY_MAP[fontStyle] || FONT_FAMILY_MAP.sans;
  const modalBg = noteColor ? { backgroundColor: noteColor } : undefined;
  const titleColorStyle = textColor ? { color: textColor } : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 animate-scale-in bg-white dark:bg-stone-800 overflow-hidden"
        style={modalBg}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/70 dark:border-stone-700/70 bg-white/40 dark:bg-stone-900/30 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              {mode === "edit" ? "Edit Note" : "New Note"}
            </h2>
            <AutoSaveIndicator status={autoSaveStatus} error={autoSaveError} />
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowCustomize((v) => !v)}
              className={`p-1.5 rounded transition ${
                showCustomize
                  ? "text-amber-600 bg-amber-50 dark:bg-amber-900/30"
                  : "text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700"
              }`}
              title="Customize appearance"
              aria-pressed={showCustomize}
            >
              <Palette className="w-4 h-4" />
            </button>
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

        {showCustomize && (
          <div className="px-6 py-4 border-b border-stone-200/70 dark:border-stone-700/70 bg-white/40 dark:bg-stone-900/30 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Appearance
              </span>
              <button
                type="button"
                onClick={() => setShowCustomize(false)}
                className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                aria-label="Hide customization"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <ColorPicker
                label="Note color"
                value={noteColor}
                onChange={setNoteColor}
                options={NOTE_COLOR_OPTIONS}
              />
              <ColorPicker
                label="Title color"
                value={textColor}
                onChange={setTextColor}
                options={TEXT_COLOR_OPTIONS}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <FontPicker value={fontStyle} onChange={setFontStyle} />
              <MoodPicker value={moodLabel} onChange={setMoodLabel} />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="w-full text-2xl font-semibold bg-transparent border-0 focus:outline-none placeholder:text-stone-300 dark:placeholder:text-stone-600"
            style={{ ...titleColorStyle, fontFamily }}
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
            rows={8}
            className="w-full bg-transparent border-0 focus:outline-none resize-none text-stone-700 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-600 leading-relaxed"
            style={{ fontFamily }}
          />

          <ChecklistEditor value={checklist} onChange={setChecklist} />

          {error && (
            <div className="text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200/70 dark:border-stone-700/70 bg-stone-50/70 dark:bg-stone-900/40">
          <p className="text-xs text-stone-400 dark:text-stone-500">
            {mode === "edit"
              ? "Changes auto-save while you type"
              : "Click Create note to save"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition"
            >
              {mode === "edit" ? "Done" : "Cancel"}
            </button>
            {mode !== "edit" && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 rounded-lg shadow-sm transition"
              >
                {saving ? "Saving…" : "Create note"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditorModal;
