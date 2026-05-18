import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

const normalize = (raw) =>
  raw
    .trim()
    .toLowerCase()
    .replace(/^#+/, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);

const TagInput = ({ value = [], onChange, suggestions = [], placeholder = "Add a tag…" }) => {
  const [draft, setDraft] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  const filteredSuggestions = useMemo(() => {
    const q = draft.trim().toLowerCase();
    return suggestions
      .filter((s) => !value.includes(s))
      .filter((s) => (q ? s.startsWith(q) && s !== q : true))
      .slice(0, 8);
  }, [draft, suggestions, value]);

  const addTag = (raw) => {
    const t = normalize(raw);
    if (!t) return;
    if (value.includes(t)) {
      setDraft("");
      return;
    }
    onChange([...value, t]);
    setDraft("");
  };

  const removeTag = (t) => onChange(value.filter((x) => x !== t));

  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  useEffect(() => {
    const onDoc = (e) => {
      if (!inputRef.current?.parentElement?.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative">
      <div
        className="flex flex-wrap items-center gap-1.5 px-2.5 py-2 bg-amber-50/40 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-700 rounded-lg focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-transparent transition"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300"
          >
            #{t}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(t);
              }}
              className="hover:text-amber-900 dark:hover:text-amber-200"
              aria-label={`Remove tag ${t}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKey}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            if (draft.trim()) addTag(draft);
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[100px] bg-transparent border-0 focus:outline-none text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
        />
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-20 left-0 right-0 mt-1 p-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg animate-fade-in">
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(s);
              }}
              className="w-full text-left px-2 py-1 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded"
            >
              #{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagInput;
