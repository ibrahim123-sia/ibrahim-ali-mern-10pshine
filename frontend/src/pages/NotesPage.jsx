import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Menu,
  Plus,
  LayoutGrid,
  List as ListIcon,
  Rows3,
} from "lucide-react";
import { useAppContext } from "../context/context.jsx";
import Sidebar from "../components/Sidebar.jsx";
import NoteCard from "../components/NoteCard.jsx";
import NoteEditorModal from "../components/NoteEditorModal.jsx";
import EmptyState from "../components/EmptyState.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { stripHtml } from "../utils/formatTime.js";

const VIEW_KEY = "nowrite-view";

const NotesPage = () => {
  const { notes, getUserNotes, deleteNote, loading } = useAppContext();
  const [view, setView] = useState(() => localStorage.getItem(VIEW_KEY) || "grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editorState, setEditorState] = useState({ open: false, mode: "create", note: null });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [firstLoad, setFirstLoad] = useState(true);
  const searchInputRef = useRef(null);

  // Initial fetch
  useEffect(() => {
    getUserNotes()
      .catch(() => {})
      .finally(() => setFirstLoad(false));
  }, [getUserNotes]);

  // Persist view choice
  useEffect(() => {
    localStorage.setItem(VIEW_KEY, view);
  }, [view]);

  // Global shortcuts: Ctrl/Cmd + N → new note, Ctrl/Cmd + K → search
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "k") {
        e.preventDefault();
        setSidebarOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (key === "n") {
        // Don't hijack inside inputs
        const tag = (e.target?.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea") return;
        e.preventDefault();
        openCreate();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // openCreate is a stable setter; safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = useCallback(() => {
    setEditorState({ open: true, mode: "create", note: null });
  }, []);
  const openEdit = useCallback((note) => {
    setEditorState({ open: true, mode: "edit", note });
  }, []);
  const closeEditor = useCallback(() => {
    setEditorState((s) => ({ ...s, open: false }));
  }, []);

  const handleDelete = async () => {
    if (!confirmDelete?._id) return;
    try {
      await deleteNote(confirmDelete._id);
    } catch {
      /* error surfaced via context */
    } finally {
      setConfirmDelete(null);
    }
  };

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const sorted = [...(notes || [])].sort((a, b) => {
      const aT = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bT = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bT - aT;
    });
    if (!q) return sorted;
    return sorted.filter((n) => {
      const inTitle = (n.title || "").toLowerCase().includes(q);
      const inContent = stripHtml(n.content || "").toLowerCase().includes(q);
      return inTitle || inContent;
    });
  }, [notes, searchQuery]);

  const showSkeletons = firstLoad && loading;
  const gridCls =
    view === "grid"
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      : view === "list"
      ? "flex flex-col gap-3"
      : "flex flex-col gap-2";

  return (
    <div className="flex h-screen bg-amber-50/40 dark:bg-stone-950 text-stone-800 dark:text-stone-100">
      <Sidebar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchInputRef={searchInputRef}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-4 border-b border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/60 backdrop-blur">
          <button
            className="md:hidden p-2 rounded hover:bg-stone-100 dark:hover:bg-stone-800"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5 text-stone-600 dark:text-stone-300" />
          </button>
          <div className="flex-1 min-w-0">
            <h1
              className="text-xl sm:text-2xl text-stone-800 dark:text-stone-100"
              style={{ fontFamily: "Georgia, serif" }}
            >
              All Notes
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {filteredNotes.length}{" "}
              {filteredNotes.length === 1 ? "note" : "notes"}
              {searchQuery && (
                <> matching "<span className="italic">{searchQuery}</span>"</>
              )}
            </p>
          </div>

          {/* View toggle */}
          <div className="hidden sm:flex items-center bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5">
            <ViewButton active={view === "grid"} onClick={() => setView("grid")} label="Grid">
              <LayoutGrid className="w-4 h-4" />
            </ViewButton>
            <ViewButton active={view === "list"} onClick={() => setView("list")} label="List">
              <ListIcon className="w-4 h-4" />
            </ViewButton>
            <ViewButton active={view === "compact"} onClick={() => setView("compact")} label="Compact">
              <Rows3 className="w-4 h-4" />
            </ViewButton>
          </div>

          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Note</span>
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          {showSkeletons ? (
            <div className={gridCls}>
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} view={view} />
              ))}
            </div>
          ) : filteredNotes.length === 0 ? (
            <EmptyState hasQuery={!!searchQuery} onCreate={openCreate} />
          ) : (
            <div className={gridCls}>
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note._id}
                  note={note}
                  view={view}
                  onEdit={openEdit}
                  onDelete={(n) => setConfirmDelete(n)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating quick-add (mobile + tablet) */}
      <button
        onClick={openCreate}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-xl flex items-center justify-center transition active:scale-95"
        aria-label="Quick add note"
      >
        <Plus className="w-6 h-6" />
      </button>

      <NoteEditorModal
        open={editorState.open}
        mode={editorState.mode}
        note={editorState.note}
        onClose={closeEditor}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this note?"
        message={`"${confirmDelete?.title || "Untitled"}" will be permanently removed.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

const ViewButton = ({ active, onClick, children, label }) => (
  <button
    onClick={onClick}
    title={label}
    aria-label={label}
    className={`p-1.5 rounded-md transition ${
      active
        ? "bg-white dark:bg-stone-700 shadow-sm text-amber-700 dark:text-amber-400"
        : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
    }`}
  >
    {children}
  </button>
);

export default NotesPage;
