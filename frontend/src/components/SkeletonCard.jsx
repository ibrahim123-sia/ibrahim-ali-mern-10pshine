const SkeletonCard = ({ view = "grid" }) => {
  if (view === "compact") {
    return (
      <div className="px-4 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg animate-pulse">
        <div className="h-3.5 w-1/2 bg-stone-200 dark:bg-stone-700 rounded" />
      </div>
    );
  }
  return (
    <div
      className={`bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-5 animate-pulse ${
        view === "grid" ? "min-h-[180px]" : ""
      }`}
    >
      <div className="h-4 w-2/3 bg-stone-200 dark:bg-stone-700 rounded mb-3" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-stone-100 dark:bg-stone-700/60 rounded" />
        <div className="h-3 w-5/6 bg-stone-100 dark:bg-stone-700/60 rounded" />
        <div className="h-3 w-3/4 bg-stone-100 dark:bg-stone-700/60 rounded" />
      </div>
      <div className="mt-4 h-3 w-16 bg-stone-100 dark:bg-stone-700/60 rounded" />
    </div>
  );
};

export default SkeletonCard;
