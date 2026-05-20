import { useState } from "react";
import {
  Sparkles,
  Wand2,
  AlignLeft,
  Folder,
  Hash,
  Check,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { useAppContext } from "../../context/context.jsx";

const Section = ({ icon, label, children }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-400">
      {icon}
      <span>{label}</span>
    </div>
    {children}
  </div>
);

const Pill = ({ onClick, busy, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={busy}
    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 disabled:opacity-50 border border-amber-200 dark:border-amber-800 rounded-full transition"
  >
    {busy ? "Thinking…" : children}
  </button>
);

const SmartPanel = ({
  title,
  content,
  onApplyTitle,
  onApplySummary,
  onApplyTags,
  onApplyCategory,
  onCreateAndApplyCategory,
}) => {
  const { suggestNote, categories, createCategory } = useAppContext();
  const [busy, setBusy] = useState(null); // 'title' | 'summary' | 'tags' | 'category' | null
  const [error, setError] = useState(null);

  const [titleSuggestion, setTitleSuggestion] = useState("");
  const [summarySuggestion, setSummarySuggestion] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [categorySuggestion, setCategorySuggestion] = useState(null); // { matchId, matchName } | { suggestName }

  const ask = async (what) => {
    if (!content.trim() && what !== "category") {
      setError("Write some content first.");
      return;
    }
    setBusy(what);
    setError(null);
    try {
      const data = await suggestNote({
        what,
        content,
        title,
        categories: categories.map((c) => ({ _id: c._id, name: c.name })),
      });
      if (!data) return;
      if (what === "title") setTitleSuggestion(data.title || "");
      else if (what === "summary") setSummarySuggestion(data.summary || "");
      else if (what === "tags") setTagSuggestions(data.tags || []);
      else if (what === "category") setCategorySuggestion(data);
    } catch (err) {
      setError(err?.message || "Suggestion failed");
    } finally {
      setBusy(null);
    }
  };

  const handleApplyCategory = async () => {
    if (!categorySuggestion) return;
    if (categorySuggestion.matchId) {
      onApplyCategory?.(categorySuggestion.matchId);
    } else if (categorySuggestion.suggestName) {
      try {
        const created = await createCategory({ name: categorySuggestion.suggestName });
        if (created?._id) onCreateAndApplyCategory?.(created._id);
      } catch {
        /* surfaced */
      }
    }
    setCategorySuggestion(null);
  };

  return (
    <div className="space-y-3 px-6 py-4 border-b border-stone-200/70 dark:border-stone-700/70 bg-gradient-to-br from-amber-50/40 to-white/0 dark:from-amber-900/10 dark:to-stone-900/0 animate-fade-in">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-600" />
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300">
          Smart suggestions
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Pill onClick={() => ask("title")} busy={busy === "title"}>
          <Wand2 className="w-3 h-3" /> Suggest title
        </Pill>
        <Pill onClick={() => ask("summary")} busy={busy === "summary"}>
          <AlignLeft className="w-3 h-3" /> Summarize
        </Pill>
        <Pill onClick={() => ask("category")} busy={busy === "category"}>
          <Folder className="w-3 h-3" /> Suggest category
        </Pill>
        <Pill onClick={() => ask("tags")} busy={busy === "tags"}>
          <Hash className="w-3 h-3" /> Suggest tags
        </Pill>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}

      {titleSuggestion && (
        <Section icon={<Wand2 className="w-3.5 h-3.5" />} label="Suggested title">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg">
            <span className="flex-1 text-sm text-stone-800 dark:text-stone-100 truncate">
              {titleSuggestion}
            </span>
            <button
              type="button"
              onClick={() => {
                onApplyTitle?.(titleSuggestion);
                setTitleSuggestion("");
              }}
              className="px-2 py-0.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded transition"
            >
              <Check className="w-3.5 h-3.5 inline" /> Use
            </button>
          </div>
        </Section>
      )}

      {summarySuggestion && (
        <Section icon={<AlignLeft className="w-3.5 h-3.5" />} label="Summary">
          <div className="px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg space-y-2">
            <p className="text-sm text-stone-700 dark:text-stone-200 leading-relaxed">
              {summarySuggestion}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onApplySummary?.(summarySuggestion);
                  setSummarySuggestion("");
                }}
                className="px-2 py-0.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded transition"
              >
                <Check className="w-3.5 h-3.5 inline" /> Insert at top
              </button>
            </div>
          </div>
        </Section>
      )}

      {categorySuggestion && (
        <Section icon={<Folder className="w-3.5 h-3.5" />} label="Suggested category">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg">
            <span className="flex-1 text-sm text-stone-800 dark:text-stone-100 truncate">
              {categorySuggestion.matchName ||
                categorySuggestion.suggestName ||
                "(no suggestion)"}
              {categorySuggestion.suggestName && (
                <span className="ml-2 text-[10px] uppercase tracking-wider text-amber-600">
                  new
                </span>
              )}
            </span>
            {(categorySuggestion.matchId || categorySuggestion.suggestName) && (
              <button
                type="button"
                onClick={handleApplyCategory}
                className="px-2 py-0.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded transition"
              >
                {categorySuggestion.matchId ? (
                  <>
                    <Check className="w-3.5 h-3.5 inline" /> Apply
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 inline" /> Create & apply
                  </>
                )}
              </button>
            )}
          </div>
        </Section>
      )}

      {tagSuggestions.length > 0 && (
        <Section icon={<Hash className="w-3.5 h-3.5" />} label="Tags">
          <div className="flex flex-wrap items-center gap-1.5">
            {tagSuggestions.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  onApplyTags?.([t]);
                  setTagSuggestions((prev) => prev.filter((x) => x !== t));
                }}
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition"
                title="Add this tag"
              >
                <Plus className="w-3 h-3" />
                {t}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                onApplyTags?.(tagSuggestions);
                setTagSuggestions([]);
              }}
              className="text-xs px-2 py-0.5 rounded-full bg-amber-600 text-white hover:bg-amber-700"
            >
              Add all
            </button>
          </div>
        </Section>
      )}
    </div>
  );
};

export default SmartPanel;
