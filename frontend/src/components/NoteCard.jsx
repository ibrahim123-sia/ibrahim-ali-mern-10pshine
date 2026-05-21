import {
  MoreVertical,
  Trash2,
  Pencil,
  Pin,
  Star,
  Archive,
  ArchiveRestore,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { formatRelativeTime, stripHtml } from "../utils/formatTime.js";
import { FONT_FAMILY_MAP } from "./customization/FontPicker.jsx";
import { findMood } from "./customization/MoodPicker.jsx";

const MoodBadge = ({ moodLabel }) => {
  const mood = findMood(moodLabel);
  if (!mood) return null;
  return (
    <span
      title={mood.label}
      aria-label={`Mood: ${mood.label}`}
      className="inline-flex items-center text-[11px] px-1 leading-none"
    >
      <span className="text-sm">{mood.emoji}</span>
    </span>
  );
};

const ChecklistProgress = ({ checklist }) => {
  if (!checklist?.length) return null;
  const done = checklist.filter((i) => i.done).length;
  const total = checklist.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="w-full" title={`Checklist: ${done}/${total} done`}>
      <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400 mb-0.5">
        <span>Checklist</span>
        <span>{done}/{total}</span>
      </div>
      <div className="h-1 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
        <div
          className="h-full bg-amber-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const buildCardStyle = (note) => {
  const style = {};
  if (note.noteColor) style.backgroundColor = note.noteColor;
  if (note.fontStyle && FONT_FAMILY_MAP[note.fontStyle]) {
    style.fontFamily = FONT_FAMILY_MAP[note.fontStyle];
  }
  return style;
};
const titleColorStyle = (note) =>
  note.textColor ? { color: note.textColor } : undefined;

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
  onStudy,
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
            {onStudy && (
              <MenuItem
                icon={<Sparkles className="w-3.5 h-3.5" />}
                onClick={() => {
                  setMenuOpen(false);
                  onStudy(note);
                }}
              >
                AI Study
              </MenuItem>
            )}
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
  onStudy,
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

  // AI Study (flashcards + quiz) is only relevant for study material,
  // so only show it on notes filed under the "Study" category.
  const noteCategory = categories.find((c) => c._id === note.category);
  const isStudyCategory =
    !!noteCategory && noteCategory.name.toLowerCase() === "study";
  const studyHandler = isStudyCategory ? onStudy : undefined;

  const handleCardClick = () => {
    if (!editable) return;
    onEdit(note);
  };

  if (view === "compact") {
    return (
      <div
        onClick={handleCardClick}
        style={buildCardStyle(note)}
        className={`group relative flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:shadow-sm hover:border-amber-300 dark:hover:border-amber-700 transition ${
          editable ? "cursor-pointer" : "opacity-75"
        } ${menuOpen ? "z-20" : ""}`}
      >
        <div className="flex items-center gap-1.5 shrink-0">
          {note.pinned && <Pin className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />}
          {note.favorite && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
          <MoodBadge moodLabel={note.moodLabel} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate"
            style={titleColorStyle(note)}
          >
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
          onStudy={studyHandler}
        />
      </div>
    );
  }

  if (view === "list") {
    return (
      <div
        onClick={handleCardClick}
        style={buildCardStyle(note)}
        className={`group relative flex items-start gap-4 p-4 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition ${
          editable ? "cursor-pointer" : "opacity-75"
        } ${menuOpen ? "z-20" : ""}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className="font-semibold text-stone-800 dark:text-stone-100 truncate"
              style={titleColorStyle(note)}
            >
              {note.title || "Untitled"}
            </h3>
            {note.pinned && <Pin className="w-3.5 h-3.5 text-amber-600 fill-amber-600 shrink-0" />}
            {note.favorite && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
            <MoodBadge moodLabel={note.moodLabel} />
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2">
            {preview || <span className="italic text-stone-400">No content</span>}
          </p>
          {note.checklist?.length > 0 && (
            <div className="mt-2 max-w-xs">
              <ChecklistProgress checklist={note.checklist} />
            </div>
          )}
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
          onStudy={studyHandler}
        />
      </div>
    );
  }

  // grid
  return (
    <div
      onClick={handleCardClick}
      style={buildCardStyle(note)}
      className={`group relative flex flex-col p-5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl hover:shadow-lg hover:-translate-y-0.5 hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200 min-h-[180px] ${
        editable ? "cursor-pointer" : "opacity-75"
      } ${menuOpen ? "z-20" : ""}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2 pr-6">
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          <h3
            className="font-semibold text-stone-800 dark:text-stone-100 line-clamp-2 flex-1"
            style={titleColorStyle(note)}
          >
            {note.title || "Untitled"}
          </h3>
          <MoodBadge moodLabel={note.moodLabel} />
        </div>
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
      {note.checklist?.length > 0 && (
        <div className="mt-3">
          <ChecklistProgress checklist={note.checklist} />
        </div>
      )}
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
        onStudy={studyHandler}
      />
    </div>
  );
};

export default NoteCard;
