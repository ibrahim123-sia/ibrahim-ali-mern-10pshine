import { FileText, Plus } from "lucide-react";

const EmptyState = ({ hasQuery, onCreate }) => {
  if (hasQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
          <FileText className="w-6 h-6 text-stone-400" />
        </div>
        <h3 className="text-lg font-medium text-stone-700 dark:text-stone-200">
          No notes match your search
        </h3>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Try a different keyword.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/30 flex items-center justify-center mb-5">
        <FileText className="w-7 h-7 text-amber-700 dark:text-amber-400" />
      </div>
      <h3
        className="text-2xl text-stone-800 dark:text-stone-100"
        style={{ fontFamily: "Georgia, serif" }}
      >
        A blank page awaits.
      </h3>
      <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 max-w-xs">
        Capture an idea, a list, a reminder — whatever's on your mind.
      </p>
      <button
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm transition"
      >
        <Plus className="w-4 h-4" /> Create your first note
      </button>
    </div>
  );
};

export default EmptyState;
