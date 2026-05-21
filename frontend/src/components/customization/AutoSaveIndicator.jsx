import { Check, Loader2, AlertTriangle } from "lucide-react";

// status: 'idle' | 'saving' | 'saved' | 'error'
const AutoSaveIndicator = ({ status, error }) => {
  if (status === "idle") return null;
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Saving…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
        <Check className="w-3.5 h-3.5" />
        Saved
      </span>
    );
  }
  if (status === "error") {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400"
        title={error || "Failed to save"}
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        Save failed
      </span>
    );
  }
  return null;
};

export default AutoSaveIndicator;
