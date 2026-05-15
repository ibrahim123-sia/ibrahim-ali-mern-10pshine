import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Check,
  X as XIcon,
  Trophy,
} from "lucide-react";

const FlashcardDeck = ({ cards, onRestart, onClose }) => {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  // Track per-card status in-session only: 'unseen' | 'known' | 'review'
  const [statuses, setStatuses] = useState(() => cards.map(() => "unseen"));
  const total = cards.length;
  const knownCount = statuses.filter((s) => s === "known").length;
  const reviewCount = statuses.filter((s) => s === "review").length;

  const go = (n) => {
    setIdx((c) => {
      const next = Math.max(0, Math.min(total - 1, c + n));
      return next;
    });
    setFlipped(false);
  };

  const mark = (status) => {
    setStatuses((prev) => prev.map((s, i) => (i === idx ? status : s)));
    if (idx < total - 1) {
      setIdx(idx + 1);
      setFlipped(false);
    }
  };

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-stone-500 dark:text-stone-400">
        No cards available.
      </div>
    );
  }

  // End-of-deck summary screen
  if (idx >= total) {
    return (
      <DeckSummary
        knownCount={knownCount}
        reviewCount={reviewCount}
        total={total}
        onRestart={() => {
          setStatuses(cards.map(() => "unseen"));
          setIdx(0);
          setFlipped(false);
          onRestart?.();
        }}
        onClose={onClose}
      />
    );
  }

  const card = cards[idx];
  const status = statuses[idx];

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
        <span>
          Card <span className="font-medium text-stone-700 dark:text-stone-200">{idx + 1}</span> of {total}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex items-center gap-0.5">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            {knownCount}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <RotateCw className="w-3.5 h-3.5 text-amber-600" />
            {reviewCount}
          </span>
        </span>
      </div>
      <div className="h-1 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
        <div
          className="h-full bg-amber-500 transition-all"
          style={{ width: `${((idx + 1) / total) * 100}%` }}
        />
      </div>

      {/* Card */}
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="w-full min-h-[260px] sm:min-h-[300px] flex flex-col items-center justify-center px-6 py-10 rounded-2xl bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-stone-800 border border-stone-200 dark:border-stone-700 shadow-md hover:shadow-lg transition relative overflow-hidden"
      >
        <span className="absolute top-3 left-4 text-[10px] uppercase tracking-wider text-stone-400">
          {flipped ? "Answer" : "Question"} · tap to flip
        </span>
        <p
          className="text-center text-lg sm:text-xl text-stone-800 dark:text-stone-100 leading-relaxed max-w-xl"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {flipped ? card.back : card.front}
        </p>
        {status !== "unseen" && (
          <span
            className={`absolute top-3 right-4 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
              status === "known"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
            }`}
          >
            {status === "known" ? "Knew it" : "Review"}
          </span>
        )}
      </button>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={idx === 0}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>

        {flipped ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => mark("review")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 rounded-lg transition"
            >
              <RotateCw className="w-4 h-4" /> Review again
            </button>
            <button
              type="button"
              onClick={() => mark("known")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
            >
              <Check className="w-4 h-4" /> I knew it
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setFlipped(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition"
          >
            Show answer
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (idx === total - 1) {
              setIdx(total); // jump to summary
            } else {
              go(1);
            }
          }}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg"
        >
          {idx === total - 1 ? "Finish" : "Next"} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const DeckSummary = ({ knownCount, reviewCount, total, onRestart, onClose }) => {
  const pct = total > 0 ? Math.round((knownCount / total) * 100) : 0;
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-md">
        <Trophy className="w-6 h-6" />
      </div>
      <h3
        className="text-2xl text-stone-800 dark:text-stone-100"
        style={{ fontFamily: "Georgia, serif" }}
      >
        Deck complete
      </h3>
      <p className="text-sm text-stone-600 dark:text-stone-300">
        You knew{" "}
        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
          {knownCount}/{total}
        </span>{" "}
        ({pct}%) · {reviewCount} to review
      </p>
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition"
        >
          Done
        </button>
        <button
          onClick={onRestart}
          className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition"
        >
          Study again
        </button>
      </div>
    </div>
  );
};

export default FlashcardDeck;
