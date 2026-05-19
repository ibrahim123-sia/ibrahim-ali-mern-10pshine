import { useMemo, useState } from "react";
import {
  Search,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  Folder,
  Hash,
  Clock,
  X,
  Plus,
  Settings2,
  Inbox,
  Pin,
  Star,
  Archive,
  Trash2,
} from "lucide-react";
import { useAppContext } from "../context/context.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useNavigate } from "react-router-dom";
import Logo from "./Logo.jsx";
import CategoryManagerModal from "./CategoryManagerModal.jsx";
import SearchSuggestions, { recordSearch } from "./SearchSuggestions.jsx";

const FILTER_CHIPS = [
  { key: "all", label: "All Notes", icon: Inbox },
  { key: "pinned", label: "Pinned", icon: Pin },
  { key: "favorites", label: "Favorites", icon: Star },
  { key: "archived", label: "Archived", icon: Archive },
  { key: "trash", label: "Trash", icon: Trash2 },
];

const Sidebar = ({
  searchQuery,
  onSearchChange,
  searchInputRef,
  isOpen,
  onClose,
  filter,
  onFilterChange,
  categoryFilter,
  onCategoryFilter,
  tagFilter,
  onTagFilter,
  onPickNote,
}) => {
  const { user, logoutUser, notes, categories } = useAppContext();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCategoryMgr, setShowCategoryMgr] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login", { replace: true });
  };

  const initial = (user?.name || user?.email || "U").charAt(0).toUpperCase();

  // Note counts per category (excluding trashed + archived)
  const categoryCounts = useMemo(() => {
    const map = {};
    for (const n of notes || []) {
      if (n.deletedAt || n.archived) continue;
      if (!n.category) continue;
      map[n.category] = (map[n.category] || 0) + 1;
    }
    return map;
  }, [notes]);

  // Aggregate all tags (excluding trashed + archived), with counts
  const tagList = useMemo(() => {
    const counts = {};
    for (const n of notes || []) {
      if (n.deletedAt || n.archived) continue;
      for (const t of n.tags || []) counts[t] = (counts[t] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
  }, [notes]);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30 animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40 w-72 flex flex-col
          bg-amber-50/60 dark:bg-stone-900
          border-r border-stone-200 dark:border-stone-800
          transform transition-transform duration-200
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        `}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <Logo size="md" />
          <button
            className="md:hidden p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-800"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4 text-stone-600 dark:text-stone-400" />
          </button>
        </div>

        {/* Profile chip */}
        <div className="px-5 pb-4">
          <button
            onClick={() => setShowProfileMenu((v) => !v)}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:shadow-sm transition"
          >
            {user?.profileImage ? (
              <img
                src={
                  user.profileImage.startsWith("http")
                    ? user.profileImage
                    : `${import.meta.env.VITE_API_ORIGIN || "http://localhost:5000"}${user.profileImage}`
                }
                alt={user.name || "Avatar"}
                className="w-8 h-8 rounded-full object-cover border border-stone-200 dark:border-stone-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-medium text-sm">
                {initial}
              </div>
            )}
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate">
                {user?.name || "Loading..."}
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400 truncate">
                {user?.email || ""}
              </div>
            </div>
            <ChevronRight
              className={`w-4 h-4 text-stone-400 transition-transform ${
                showProfileMenu ? "rotate-90" : ""
              }`}
            />
          </button>

          {showProfileMenu && (
            <div className="mt-2 p-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 animate-fade-in">
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onClose?.();
                  navigate("/profile");
                }}
                className="w-full text-left px-3 py-2 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded"
              >
                Manage profile
              </button>
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="w-4 h-4" /> Light mode
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" /> Dark mode
                  </>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              >
                <LogOut className="w-4 h-4" /> Log out
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  recordSearch(searchQuery);
                  setShowSuggestions(false);
                } else if (e.key === "Escape") {
                  setShowSuggestions(false);
                }
              }}
              placeholder="Search notes…"
              className="w-full pl-9 pr-9 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
            />
            <kbd className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 items-center text-[10px] text-stone-400 border border-stone-200 dark:border-stone-700 rounded px-1.5 py-0.5 bg-stone-50 dark:bg-stone-900 pointer-events-none">
              Ctrl K
            </kbd>
            {showSuggestions && (
              <SearchSuggestions
                query={searchQuery}
                notes={notes}
                categories={categories}
                onPickNote={(n) => {
                  recordSearch(searchQuery);
                  onPickNote?.(n);
                  setShowSuggestions(false);
                }}
                onPickCategory={(c) => {
                  onCategoryFilter(c._id);
                  onTagFilter(null);
                  onFilterChange("all");
                  setShowSuggestions(false);
                  onSearchChange("");
                }}
                onPickTag={(t) => {
                  onTagFilter(t);
                  onCategoryFilter(null);
                  onFilterChange("all");
                  setShowSuggestions(false);
                  onSearchChange("");
                }}
                onPickRecent={(q) => {
                  onSearchChange(q);
                  recordSearch(q);
                  setShowSuggestions(false);
                }}
                onClose={() => setShowSuggestions(false)}
              />
            )}
          </div>
        </div>

        {/* Scrollable sections */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-6">
          {/* Filter chips */}
          <section>
            <ul className="space-y-0.5">
              {FILTER_CHIPS.map((chip) => {
                const active =
                  filter === chip.key && !categoryFilter && !tagFilter;
                return (
                  <li key={chip.key}>
                    <button
                      onClick={() => {
                        onFilterChange(chip.key);
                        onCategoryFilter(null);
                        onTagFilter(null);
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-sm rounded-lg transition ${
                        active
                          ? "bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-medium"
                          : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                      }`}
                    >
                      <chip.icon className="w-4 h-4 shrink-0" />
                      <span>{chip.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Categories */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                <Folder className="w-3.5 h-3.5" />
                Categories
              </h3>
              <button
                onClick={() => setShowCategoryMgr(true)}
                className="p-1 rounded text-stone-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                title="Manage categories"
                aria-label="Manage categories"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {categories.length === 0 ? (
              <button
                onClick={() => setShowCategoryMgr(true)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add your first category
              </button>
            ) : (
              <ul className="space-y-0.5">
                {categories.map((cat) => {
                  const active = categoryFilter === cat._id;
                  return (
                    <li key={cat._id}>
                      <button
                        onClick={() => {
                          onCategoryFilter(active ? null : cat._id);
                          onTagFilter(null);
                          onFilterChange("all");
                        }}
                        className={`w-full flex items-center justify-between px-2 py-1.5 text-sm rounded transition ${
                          active
                            ? "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium"
                            : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color || "#f59e0b" }}
                          />
                          <span className="truncate">{cat.name}</span>
                        </span>
                        <span className="text-xs text-stone-400">
                          {categoryCounts[cat._id] || 0}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Tags */}
          <section>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
              <Hash className="w-3.5 h-3.5" />
              Tags
            </h3>
            {tagList.length === 0 ? (
              <p className="text-xs text-stone-400 dark:text-stone-500 italic px-2">
                Tags you add to notes appear here.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {tagList.map(([tag, count]) => {
                  const active = tagFilter === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        onTagFilter(active ? null : tag);
                        onCategoryFilter(null);
                        onFilterChange("all");
                      }}
                      className={`text-xs px-2 py-0.5 rounded-full border transition ${
                        active
                          ? "bg-amber-600 text-white border-amber-700"
                          : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-amber-300"
                      }`}
                      title={`${count} note${count === 1 ? "" : "s"}`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recent activity placeholder */}
          <section>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
              <Clock className="w-3.5 h-3.5" />
              Recent Activity
            </h3>
            <p className="text-xs text-stone-400 dark:text-stone-500 italic px-2">
              Your edits will show up here.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200 dark:border-stone-800 text-[11px] text-stone-400 dark:text-stone-500">
          NoWrite · v0.1
        </div>
      </aside>

      <CategoryManagerModal
        open={showCategoryMgr}
        onClose={() => setShowCategoryMgr(false)}
      />
    </>
  );
};

export default Sidebar;
