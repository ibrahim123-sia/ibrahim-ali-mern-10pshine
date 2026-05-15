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

const FILTER_TITLES = {
  all: "All Notes",
  pinned: "Pinned",
  favorites: "Favorites",
  archived: "Archived",
  trash: "Trash",
};

const NotesPage = () => {
  const {
    notes,
    categories,
    getUserNotes,
    getCategories,
    deleteNote,
    patchNote,
    loading,
  } = useAppContext();
  const [view, setView] = useState(() => localStorage.getItem(VIEW_KEY) || "grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editorState, setEditorState] = useState({ open: false, mode: "create", note: null });
  const [confirmTrash, setConfirmTrash] = useState(null); // soft-delete confirmation
  const [confirmHardDelete, setConfirmHardDelete] = useState(null); // permanent delete
  const [firstLoad, setFirstLoad] = useState(true);
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [tagFilter, setTagFilter] = useState(null);
  const searchInputRef = useRef(null);

  // Initial fetch (notes + categories)
  useEffect(() => {
    Promise.all([
      getUserNotes().catch(() => {}),
      getCategories().catch(() => {}),
    ]).finally(() => setFirstLoad(false));
  }, [getUserNotes, getCategories]);

  useEffect(() => {
    localStorage.setItem(VIEW_KEY, view);
  }, [view]);

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
        const tag = (e.target?.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea") return;
        e.preventDefault();
        openCreate();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
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

  // Soft delete (move to trash) — used for non-trash notes
  const handleMoveToTrash = async () => {
    if (!confirmTrash?._id) return;
    try {
      await patchNote(confirmTrash._id, { deletedAt: new Date().toISOString() });
    } catch {
      /* surfaced via context */
    } finally {
      setConfirmTrash(null);
    }
  };

  // Permanent delete (from Trash)
  const handlePermanentDelete = async () => {
    if (!confirmHardDelete?._id) return;
    try {
      await deleteNote(confirmHardDelete._id);
    } catch {
      /* surfaced via context */
    } finally {
      setConfirmHardDelete(null);
    }
  };

  const togglePin = useCallback(
    (note) => patchNote(note._id, { pinned: !note.pinned }).catch(() => {}),
    [patchNote]
  );
  const toggleFavorite = useCallback(
    (note) => patchNote(note._id, { favorite: !note.favorite }).catch(() => {}),
    [patchNote]
  );
  const archiveNote = useCallback(
    (note) => patchNote(note._id, { archived: true }).catch(() => {}),
    [patchNote]
  );
  const unarchiveNote = useCallback(
    (note) => patchNote(note._id, { archived: false }).catch(() => {}),
    [patchNote]
  );
  const restoreNote = useCallback(
    (note) => patchNote(note._id, { deletedAt: null, archived: false }).catch(() => {}),
    [patchNote]
  );

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = (notes || []).filter((n) => {
      const inTrash = !!n.deletedAt;
      const isArchived = !!n.archived;

      // Apply primary filter
      if (filter === "trash") {
        if (!inTrash) return false;
      } else if (filter === "archived") {
        if (inTrash || !isArchived) return false;
      } else {
        // For all/pinned/favorites: exclude trash + archived
        if (inTrash || isArchived) return false;
        if (filter === "pinned" && !n.pinned) return false;
        if (filter === "favorites" && !n.favorite) return false;
      }

      // Category filter (active in conjunction with primary)
      if (categoryFilter && n.category !== categoryFilter) return false;

      // Tag filter
      if (tagFilter && !(n.tags || []).includes(tagFilter)) return false;

      // Search filter
      if (q) {
        const inTitle = (n.title || "").toLowerCase().includes(q);
        const inContent = stripHtml(n.content || "").toLowerCase().includes(q);
        const inTags = (n.tags || []).some((t) => t.includes(q));
        if (!inTitle && !inContent && !inTags) return false;
      }
      return true;
    });

    // Sort: pinned first (in non-trash views), then by updatedAt desc
    return list.sort((a, b) => {
      if (filter !== "trash") {
        if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
      }
      const aT = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bT = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bT - aT;
    });
  }, [notes, searchQuery, filter, categoryFilter, tagFilter]);

  const pageTitle = useMemo(() => {
    if (categoryFilter) {
      const cat = categories.find((c) => c._id === categoryFilter);
      return cat ? cat.name : "Category";
    }
    if (tagFilter) return `#${tagFilter}`;
    return FILTER_TITLES[filter] || "Notes";
  }, [filter, categoryFilter, tagFilter, categories]);

  const showSkeletons = firstLoad && loading;
  const gridCls =
    view === "grid"
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      : view === "list"
      ? "flex flex-col gap-3"
      : "flex flex-col gap-2";

  const isTrashView = filter === "trash";

  return (
    <div className="flex h-screen bg-amber-50/40 dark:bg-stone-950 text-stone-800 dark:text-stone-100">
      <Sidebar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchInputRef={searchInputRef}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        filter={filter}
        onFilterChange={setFilter}
        categoryFilter={categoryFilter}
        onCategoryFilter={setCategoryFilter}
        tagFilter={tagFilter}
        onTagFilter={setTagFilter}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
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
              className="text-xl sm:text-2xl text-stone-800 dark:text-stone-100 truncate"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {pageTitle}
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {filteredNotes.length}{" "}
              {filteredNotes.length === 1 ? "note" : "notes"}
              {searchQuery && (
                <> matching "<span className="italic">{searchQuery}</span>"</>
              )}
            </p>
          </div>

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

          {!isTrashView && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Note</span>
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          {showSkeletons ? (
            <div className={gridCls}>
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} view={view} />
              ))}
            </div>
          ) : filteredNotes.length === 0 ? (
            <EmptyState
              hasQuery={!!searchQuery || !!categoryFilter || !!tagFilter || filter !== "all"}
              onCreate={openCreate}
            />
          ) : (
            <div className={gridCls}>
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note._id}
                  note={note}
                  view={view}
                  categories={categories}
                  onEdit={openEdit}
                  onDelete={(n) => setConfirmTrash(n)}
                  onTogglePin={togglePin}
                  onToggleFavorite={toggleFavorite}
                  onArchive={archiveNote}
                  onUnarchive={unarchiveNote}
                  onRestore={restoreNote}
                  onPermanentDelete={(n) => setConfirmHardDelete(n)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {!isTrashView && (
        <button
          onClick={openCreate}
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-xl flex items-center justify-center transition active:scale-95"
          aria-label="Quick add note"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      <NoteEditorModal
        open={editorState.open}
        mode={editorState.mode}
        note={editorState.note}
        onClose={closeEditor}
      />

      <ConfirmDialog
        open={!!confirmTrash}
        title="Move this note to Trash?"
        message={`"${confirmTrash?.title || "Untitled"}" will be moved to Trash. You can restore it from there.`}
        confirmLabel="Move to Trash"
        danger
        onConfirm={handleMoveToTrash}
        onCancel={() => setConfirmTrash(null)}
      />

      <ConfirmDialog
        open={!!confirmHardDelete}
        title="Delete forever?"
        message={`"${confirmHardDelete?.title || "Untitled"}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete forever"
        danger
        onConfirm={handlePermanentDelete}
        onCancel={() => setConfirmHardDelete(null)}
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
