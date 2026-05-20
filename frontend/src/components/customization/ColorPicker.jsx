import { Check, X } from "lucide-react";

const ColorPicker = ({ value, onChange, options, label, size = "md" }) => {
  const swatchSize = size === "sm" ? "w-5 h-5" : "w-6 h-6";
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-1.5 items-center">
        <button
          type="button"
          onClick={() => onChange("")}
          className={`${swatchSize} rounded-full border-2 flex items-center justify-center transition ${
            !value
              ? "border-stone-500 dark:border-stone-300"
              : "border-stone-200 dark:border-stone-600 hover:border-stone-400"
          }`}
          style={{
            background:
              "repeating-linear-gradient(45deg, #f5f5f4, #f5f5f4 3px, #e7e5e4 3px, #e7e5e4 6px)",
          }}
          title="None"
          aria-label="No color"
        >
          {!value && <X className="w-3 h-3 text-stone-700" />}
        </button>
        {options.map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => onChange(c)}
            className={`${swatchSize} rounded-full border-2 flex items-center justify-center transition ${
              value === c
                ? "border-stone-500 dark:border-stone-300 scale-110"
                : "border-transparent hover:border-stone-300"
            }`}
            style={{ backgroundColor: c }}
            title={c}
            aria-label={`Color ${c}`}
          >
            {value === c && <Check className="w-3 h-3 text-white drop-shadow" />}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ColorPicker;
