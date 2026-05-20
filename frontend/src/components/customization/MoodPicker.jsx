export const MOODS = [
  { key: "productive", emoji: "😀", label: "Productive" },
  { key: "study", emoji: "📚", label: "Study" },
  { key: "idea", emoji: "💡", label: "Idea" },
  { key: "important", emoji: "⚠️", label: "Important" },
];

export const findMood = (key) => MOODS.find((m) => m.key === key) || null;

const MoodPicker = ({ value, onChange, label = "Mood" }) => (
  <div>
    {label && (
      <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">
        {label}
      </label>
    )}
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => onChange("")}
        className={`px-2.5 py-1 text-xs rounded-full border transition ${
          !value
            ? "bg-stone-200 dark:bg-stone-700 border-stone-400 dark:border-stone-500 text-stone-800 dark:text-stone-100 font-medium"
            : "bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500 hover:border-amber-300"
        }`}
      >
        None
      </button>
      {MOODS.map((m) => {
        const active = value === m.key;
        return (
          <button
            type="button"
            key={m.key}
            onClick={() => onChange(m.key)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border transition ${
              active
                ? "bg-amber-100 dark:bg-amber-900/40 border-amber-400 text-amber-900 dark:text-amber-200 font-medium"
                : "bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-amber-300"
            }`}
          >
            <span>{m.emoji}</span>
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);

export default MoodPicker;
