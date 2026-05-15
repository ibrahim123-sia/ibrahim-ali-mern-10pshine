import { MoreVertical, Trash2, Pencil } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { formatRelativeTime, stripHtml } from "../utils/formatTime.js";

const NoteCard = ({ note, view = "grid", onEdit, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const preview = stripHtml(note.content || "");
  const time = formatRelativeTime(note.updatedAt || note.createdAt);

  if (view === "compact") {
    return (
      <div
        onClick={() => onEdit(note)}
        className="group flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:shadow-sm hover:border-amber-300 dark:hover:border-amber-700 cursor-pointer transition"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate">
            {note.title || "Untitled"}
          </div>
        </div>
        <span className="text-xs text-stone-400 dark:text-stone-500 whitespace-nowrap">
          {time}
        </span>
      </div>
    );
  }

  if (view === "list") {
    return (
      <div
        onClick={() => onEdit(note)}
        className="group relative flex items-start gap-4 p-4 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 cursor-pointer transition"
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-1 truncate">
            {note.title || "Untitled"}
          </h3>
          <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2">
            {preview || <span className="italic text-stone-400">No content</span>}
          </p>
          <div className="mt-2 text-xs text-stone-400 dark:text-stone-500">
            {time}
          </div>
        </div>
        <CardMenu
          menuRef={menuRef}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          note={note}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    );
  }

  // grid
  return (
    <div
      onClick={() => onEdit(note)}
      className="group relative flex flex-col p-5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl hover:shadow-lg hover:-translate-y-0.5 hover:border-amber-300 dark:hover:border-amber-700 cursor-pointer transition-all duration-200 min-h-[180px]"
    >
      <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-2 line-clamp-2 pr-6">
        {note.title || "Untitled"}
      </h3>
      <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-4 flex-1">
        {preview || <span className="italic text-stone-400">No content</span>}
      </p>
      <div className="mt-3 text-xs text-stone-400 dark:text-stone-500">{time}</div>
      <CardMenu
        menuRef={menuRef}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        note={note}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
};

const CardMenu = ({ menuRef, menuOpen, setMenuOpen, note, onEdit, onDelete }) => (
  <div ref={menuRef} className="absolute top-3 right-3">
    <button
      onClick={(e) => {
        e.stopPropagation();
        setMenuOpen((v) => !v);
      }}
      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-stone-100 dark:hover:bg-stone-700 transition"
      aria-label="Note actions"
    >
      <MoreVertical className="w-4 h-4 text-stone-500" />
    </button>
    {menuOpen && (
      <div
        className="absolute right-0 top-7 w-32 p-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg animate-fade-in z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            setMenuOpen(false);
            onEdit(note);
          }}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
        <button
          onClick={() => {
            setMenuOpen(false);
            onDelete(note);
          }}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    )}
  </div>
);

export default NoteCard;
