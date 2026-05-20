import {
  MoreVertical,
  Trash2,
  Pencil,
  Pin,
  Star,
  Archive,
  ArchiveRestore,
  RotateCcw,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { formatRelativeTime, stripHtml } from "../utils/formatTime.js";

const CategoryBadge = ({ category, categories }) => {
  if (!category || !categories) return null;
  const cat = categories.find((c) => c._id === category);
  if (!cat) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full font-medium border"
      style={{
        borderColor: `${cat.color}55`,
        backgroundColor: `${cat.color}1a`,
        color: cat.color,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: cat.color }}
      />
      {cat.name}
    </span>
  );
};

const TagChips = ({ tags, max = 3 }) => {
  if (!tags?.length) return null;
  const shown = tags.slice(0, max);
  const overflow = tags.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((t) => (
        <span
          key={t}
          className="text-[11px] px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-700/60 text-stone-600 dark:text-stone-300"
        >
          #{t}
        </span>
      ))}
      {overflow > 0 && (
        <span className="text-[11px] text-stone-400">+{overflow}</span>
      )}
    </div>
  );
};

const QuickToggle = ({ active, activeColor, onClick, title, children }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    title={title}
    aria-label={title}
    aria-pressed={active}
    className={`p-1 rounded transition ${
      active
        ? `${activeColor}`
        : "text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 opacity-0 group-hover:opacity-100"
    }`}
  >
    {children}
  </button>
);

const QuickActions = ({ note, editable, onTogglePin, onToggleFavorite }) => {
  if (!editable) return null;
  return (
    <>
      <QuickToggle
        active={note.pinned}
        activeColor="text-amber-600"
        onClick={() => onTogglePin?.(note)}
        title={note.pinned ? "Unpin" : "Pin"}
      >
        <Pin className={`w-4 h-4 ${note.pinned ? "fill-amber-600" : ""}`} />
      </QuickToggle>
      <QuickToggle
        active={note.favorite}
        activeColor="text-amber-500"
        onClick={() => onToggleFavorite?.(note)}
        title={note.favorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Star className={`w-4 h-4 ${note.favorite ? "fill-amber-500" : ""}`} />
      </QuickToggle>
    </>
  );
};

const MenuItem = ({ icon, onClick, children, danger }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded ${
      danger
        ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
        : "text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700"
    }`}
  >
    {icon} {children}
  </button>
);

const CardMenu = ({
  menuRef,
  menuOpen,
  setMenuOpen,
  note,
  isTrash,
  isArchived,
  onEdit,
  onDelete,
  onArchive,
  onUnarchive,
  onRestore,
  onPermanentDelete,
}) => (
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
        className="absolute right-0 top-7 w-40 p-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg animate-fade-in z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {isTrash ? (
          <>
            <MenuItem
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => {
                setMenuOpen(false);
                onRestore?.(note);
              }}
            >
              Restore
            </MenuItem>
            <MenuItem
              danger
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => {
                setMenuOpen(false);
                onPermanentDelete?.(note);
              }}
            >
              Delete forever
            </MenuItem>
          </>
        ) : (
          <>
            <MenuItem
              icon={<Pencil className="w-3.5 h-3.5" />}
              onClick={() => {
                setMenuOpen(false);
                onEdit(note);
              }}
            >
              Edit
            </MenuItem>
            {isArchived ? (
              <MenuItem
                icon={<ArchiveRestore className="w-3.5 h-3.5" />}
                onClick={() => {
                  setMenuOpen(false);
                  onUnarchive?.(note);
                }}
              >
                Unarchive
              </MenuItem>
            ) : (
              <MenuItem
                icon={<Archive className="w-3.5 h-3.5" />}
                onClick={() => {
                  setMenuOpen(false);
                  onArchive?.(note);
                }}
              >
                Archive
              </MenuItem>
            )}
            <MenuItem
              danger
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => {
                setMenuOpen(false);
                onDelete(note);
              }}
            >
              Move to trash
            </MenuItem>
          </>
        )}
      </div>
    )}
  </div>
);

const NoteCard = ({
  note,
  view = "grid",
  categories = [],
  onEdit,
  onDelete,
  onTogglePin,
  onToggleFavorite,
  onArchive,
  onUnarchive,
  onRestore,
  onPermanentDelete,
}) => {
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

  const isTrash = !!note.deletedAt;
  const isArchived = !!note.archived && !isTrash;
  const editable = !isTrash;

  const handleCardClick = () => {
    if (!editable) return;
    onEdit(note);
  };

  if (view === "compact") {
    return (
      <div
        onClick={handleCardClick}
        className={`group relative flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:shadow-sm hover:border-amber-300 dark:hover:border-amber-700 transition ${
          editable ? "cursor-pointer" : "opacity-75"
        } ${menuOpen ? "z-20" : ""}`}
      >
        <div className="flex items-center gap-1.5 shrink-0">
          {note.pinned && <Pin className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />}
          {note.favorite && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate">
            {note.title || "Untitled"}
          </div>
        </div>
        <CategoryBadge category={note.category} categories={categories} />
        <span className="text-xs text-stone-400 dark:text-stone-500 whitespace-nowrap">
          {time}
        </span>
        <CardMenu
          menuRef={menuRef}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          note={note}
          isTrash={isTrash}
          isArchived={isArchived}
          onEdit={onEdit}
          onDelete={onDelete}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
          onRestore={onRestore}
          onPermanentDelete={onPermanentDelete}
        />
      </div>
    );
  }

  if (view === "list") {
    return (
      <div
        onClick={handleCardClick}
        className={`group relative flex items-start gap-4 p-4 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition ${
          editable ? "cursor-pointer" : "opacity-75"
        } ${menuOpen ? "z-20" : ""}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-stone-800 dark:text-stone-100 truncate">
              {note.title || "Untitled"}
            </h3>
            {note.pinned && <Pin className="w-3.5 h-3.5 text-amber-600 fill-amber-600 shrink-0" />}
            {note.favorite && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2">
            {preview || <span className="italic text-stone-400">No content</span>}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-stone-400 dark:text-stone-500">{time}</span>
            <CategoryBadge category={note.category} categories={categories} />
            <TagChips tags={note.tags} />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <QuickActions
            note={note}
            editable={editable}
            onTogglePin={onTogglePin}
            onToggleFavorite={onToggleFavorite}
          />
        </div>
        <CardMenu
          menuRef={menuRef}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          note={note}
          isTrash={isTrash}
          isArchived={isArchived}
          onEdit={onEdit}
          onDelete={onDelete}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
          onRestore={onRestore}
          onPermanentDelete={onPermanentDelete}
        />
      </div>
    );
  }

  // grid
  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex flex-col p-5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl hover:shadow-lg hover:-translate-y-0.5 hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200 min-h-[180px] ${
        editable ? "cursor-pointer" : "opacity-75"
      } ${menuOpen ? "z-20" : ""}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2 pr-6">
        <h3 className="font-semibold text-stone-800 dark:text-stone-100 line-clamp-2 flex-1">
          {note.title || "Untitled"}
        </h3>
        <div className="flex items-center gap-0.5 shrink-0">
          <QuickActions
            note={note}
            editable={editable}
            onTogglePin={onTogglePin}
            onToggleFavorite={onToggleFavorite}
          />
        </div>
      </div>
      <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-4 flex-1">
        {preview || <span className="italic text-stone-400">No content</span>}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-stone-400 dark:text-stone-500">{time}</span>
        <CategoryBadge category={note.category} categories={categories} />
        <TagChips tags={note.tags} />
      </div>
      <CardMenu
        menuRef={menuRef}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        note={note}
        isTrash={isTrash}
        isArchived={isArchived}
        onEdit={onEdit}
        onDelete={onDelete}
        onArchive={onArchive}
        onUnarchive={onUnarchive}
        onRestore={onRestore}
        onPermanentDelete={onPermanentDelete}
      />
    </div>
  );
};

export default NoteCard;
