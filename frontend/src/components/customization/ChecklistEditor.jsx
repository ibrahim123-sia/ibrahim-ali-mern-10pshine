import { useRef } from "react";
import { Plus, X, GripVertical, Square, CheckSquare } from "lucide-react";

const ChecklistEditor = ({ value = [], onChange, label = "Checklist" }) => {
  const inputRefs = useRef([]);

  const update = (idx, partial) => {
    onChange(value.map((item, i) => (i === idx ? { ...item, ...partial } : item)));
  };
  const remove = (idx) => onChange(value.filter((_, i) => i !== idx));
  const add = () => {
    onChange([...value, { text: "", done: false }]);
    setTimeout(() => {
      const last = inputRefs.current[value.length];
      last?.focus();
    }, 30);
  };

  const handleKey = (e, idx) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && value[idx].text === "" && value.length > 0) {
      e.preventDefault();
      remove(idx);
      setTimeout(() => inputRefs.current[Math.max(0, idx - 1)]?.focus(), 20);
    }
  };

  const totalDone = value.filter((i) => i.done).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-stone-600 dark:text-stone-400">
          {label}
        </label>
        {value.length > 0 && (
          <span className="text-[11px] text-stone-400">
            {totalDone}/{value.length} done
          </span>
        )}
      </div>
      <div className="bg-amber-50/40 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-700 rounded-lg p-2 space-y-1">
        {value.length === 0 && (
          <p className="text-xs text-stone-400 italic px-2 py-1.5">
            No items yet. Add one below.
          </p>
        )}
        {value.map((item, idx) => (
          <div
            key={idx}
            className="group flex items-center gap-2 px-1.5 py-1 rounded hover:bg-white/60 dark:hover:bg-stone-800/60"
          >
            <GripVertical className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 shrink-0" />
            <button
              type="button"
              onClick={() => update(idx, { done: !item.done })}
              className="text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 shrink-0"
              aria-label={item.done ? "Mark not done" : "Mark done"}
            >
              {item.done ? (
                <CheckSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
            <input
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              value={item.text}
              onChange={(e) => update(idx, { text: e.target.value })}
              onKeyDown={(e) => handleKey(e, idx)}
              placeholder="Checklist item"
              maxLength={200}
              className={`flex-1 min-w-0 bg-transparent text-sm focus:outline-none ${
                item.done
                  ? "line-through text-stone-400 dark:text-stone-500"
                  : "text-stone-800 dark:text-stone-100"
              } placeholder:text-stone-400`}
            />
            <button
              type="button"
              onClick={() => remove(idx)}
              className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-600 shrink-0"
              aria-label="Remove item"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 px-1.5 py-1 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add item
        </button>
      </div>
    </div>
  );
};

export default ChecklistEditor;
