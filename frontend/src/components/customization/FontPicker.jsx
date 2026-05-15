const FONTS = [
  { key: "sans", label: "Sans", style: { fontFamily: "system-ui, sans-serif" } },
  { key: "serif", label: "Serif", style: { fontFamily: "Georgia, serif" } },
  { key: "mono", label: "Mono", style: { fontFamily: "ui-monospace, Menlo, monospace" } },
];

const FontPicker = ({ value, onChange, label = "Font" }) => (
  <div>
    {label && (
      <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">
        {label}
      </label>
    )}
    <div className="flex gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5">
      {FONTS.map((f) => {
        const active = value === f.key;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => onChange(f.key)}
            style={f.style}
            className={`flex-1 px-2 py-1 text-sm rounded-md transition ${
              active
                ? "bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-stone-100 font-medium"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            }`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  </div>
);

export const FONT_FAMILY_MAP = {
  sans: "system-ui, -apple-system, sans-serif",
  serif: "Georgia, Cambria, serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};

export default FontPicker;
