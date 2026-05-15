import { useState } from "react";
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
} from "lucide-react";
import { useAppContext } from "../context/context.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useNavigate } from "react-router-dom";
import Logo from "./Logo.jsx";

// Static placeholders — these become real in later PRs (categories / tags / activity)
const PLACEHOLDER_CATEGORIES = [
  { name: "Study", color: "bg-blue-500", count: 0 },
  { name: "Work", color: "bg-emerald-500", count: 0 },
  { name: "Personal", color: "bg-pink-500", count: 0 },
  { name: "Ideas", color: "bg-purple-500", count: 0 },
  { name: "Tasks", color: "bg-amber-500", count: 0 },
];
const PLACEHOLDER_TAGS = ["#mern", "#dbms", "#exam", "#important"];

const Sidebar = ({
  searchQuery,
  onSearchChange,
  searchInputRef,
  isOpen,
  onClose,
}) => {
  const { user, logoutUser } = useAppContext();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login", { replace: true });
  };

  const initial = (user?.name || user?.email || "U").charAt(0).toUpperCase();

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
            <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-medium text-sm">
              {initial}
            </div>
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
                disabled
                className="w-full text-left px-3 py-2 text-sm text-stone-400 dark:text-stone-500 rounded cursor-not-allowed"
                title="Coming in the Profile PR"
              >
                Manage profile (soon)
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search notes…"
              className="w-full pl-9 pr-9 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
            />
            <kbd className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 items-center text-[10px] text-stone-400 border border-stone-200 dark:border-stone-700 rounded px-1.5 py-0.5 bg-stone-50 dark:bg-stone-900">
              Ctrl K
            </kbd>
          </div>
        </div>

        {/* Scrollable sections */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-6">
          {/* Categories (placeholders) */}
          <section>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
              <Folder className="w-3.5 h-3.5" />
              Categories
            </h3>
            <ul className="space-y-1">
              {PLACEHOLDER_CATEGORIES.map((cat) => (
                <li key={cat.name}>
                  <button
                    disabled
                    className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-stone-500 dark:text-stone-500 rounded cursor-not-allowed opacity-70"
                    title="Coming in the Categories PR"
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${cat.color}`} />
                      {cat.name}
                    </span>
                    <span className="text-xs text-stone-400">{cat.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Tags (placeholders) */}
          <section>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
              <Hash className="w-3.5 h-3.5" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {PLACEHOLDER_TAGS.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-500 border border-stone-200 dark:border-stone-700 cursor-not-allowed"
                  title="Coming in the Tags PR"
                >
                  {tag}
                </span>
              ))}
            </div>
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
    </>
  );
};

export default Sidebar;
