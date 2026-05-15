import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useAppContext } from "../context/context.jsx";

const NoteEditorModal = ({ open, mode = "create", note, onClose }) => {
  const { createNote, updateNote } = useAppContext();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const titleRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setTitle(note?.title || "");
    setContent(note?.content || "");
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
    try {
      if (mode === "edit" && note?._id) {
        await updateNote(note._id, {
          title: trimmedTitle || "Untitled",
          content: trimmedContent,
        });
      } else {
        await createNote({
          title: trimmedTitle || "Untitled",
          content: trimmedContent,
        });
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
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-stone-800 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-700">
          <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            {mode === "edit" ? "Edit Note" : "New Note"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-700"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-stone-500" />
          </button>
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
            Rich formatting coming soon
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
