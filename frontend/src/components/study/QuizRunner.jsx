import { useState } from "react";
import { Check, X as XIcon, ChevronRight, Trophy, RotateCw } from "lucide-react";

const QuizRunner = ({ questions, onRestart, onClose }) => {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null); // index of picked option for current question
  const [answers, setAnswers] = useState([]); // [{ pickedIndex, correctIndex }]
  const total = questions.length;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-stone-500 dark:text-stone-400">
        No questions available.
      </div>
    );
  }

  // Results screen
  if (idx >= total) {
    const correctCount = answers.filter((a) => a.pickedIndex === a.correctIndex).length;
    const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const tone =
      pct >= 80
        ? "emerald"
        : pct >= 50
        ? "amber"
        : "rose";
    const colorMap = {
      emerald: "from-emerald-400 to-emerald-600",
      amber: "from-amber-400 to-amber-600",
      rose: "from-rose-400 to-rose-600",
    };
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
          <div
            className={`w-14 h-14 rounded-full bg-gradient-to-br ${colorMap[tone]} text-white flex items-center justify-center shadow-md`}
          >
            <Trophy className="w-6 h-6" />
          </div>
          <h3
            className="text-2xl text-stone-800 dark:text-stone-100"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {correctCount} / {total}
          </h3>
          <p className="text-sm text-stone-600 dark:text-stone-300">
            {pct}% correct
          </p>
        </div>

        {/* Review answers */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {questions.map((q, i) => {
            const a = answers[i];
            const isCorrect = a?.pickedIndex === q.correctIndex;
            return (
              <div
                key={i}
                className={`px-3 py-2 border rounded-lg ${
                  isCorrect
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10"
                    : "border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/10"
                }`}
              >
                <div className="flex items-start gap-2">
                  {isCorrect ? (
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  ) : (
                    <XIcon className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  )}
                  <div className="text-sm text-stone-800 dark:text-stone-100 flex-1">
                    {q.question}
                  </div>
                </div>
                <div className="mt-1 ml-6 text-xs text-stone-600 dark:text-stone-300">
                  Correct: <span className="font-medium">{q.options[q.correctIndex]}</span>
                  {!isCorrect && a && (
                    <>
                      {" · "}you picked{" "}
                      <span className="font-medium">{q.options[a.pickedIndex]}</span>
                    </>
                  )}
                </div>
                {q.explanation && (
                  <div className="mt-1 ml-6 text-xs text-stone-500 dark:text-stone-400 italic">
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition"
          >
            Done
          </button>
          <button
            onClick={() => {
              setAnswers([]);
              setIdx(0);
              setPicked(null);
              onRestart?.();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition"
          >
            <RotateCw className="w-4 h-4" /> Retake
          </button>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  const submitted = picked !== null;

  const handleNext = () => {
    setAnswers((a) => [...a, { pickedIndex: picked, correctIndex: q.correctIndex }]);
    setPicked(null);
    setIdx(idx + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
        <span>
          Question <span className="font-medium text-stone-700 dark:text-stone-200">{idx + 1}</span>{" "}
          of {total}
        </span>
      </div>
      <div className="h-1 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
        <div
          className="h-full bg-amber-500 transition-all"
          style={{ width: `${((idx + 1) / total) * 100}%` }}
        />
      </div>

      <h3
        className="text-lg sm:text-xl text-stone-800 dark:text-stone-100 leading-relaxed"
        style={{ fontFamily: "Georgia, serif" }}
      >
        {q.question}
      </h3>

      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const isPicked = picked === i;
          const isCorrect = i === q.correctIndex;
          let tone =
            "border-stone-200 dark:border-stone-700 hover:border-amber-300 bg-white dark:bg-stone-800";
          if (submitted) {
            if (isCorrect) {
              tone =
                "border-emerald-400 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30";
            } else if (isPicked) {
              tone = "border-rose-400 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/30";
            } else {
              tone = "border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 opacity-70";
            }
          } else if (isPicked) {
            tone =
              "border-amber-400 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30";
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => !submitted && setPicked(i)}
              disabled={submitted}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border rounded-lg transition ${tone}`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  submitted && isCorrect
                    ? "bg-emerald-600 text-white"
                    : submitted && isPicked
                    ? "bg-rose-600 text-white"
                    : isPicked
                    ? "bg-amber-600 text-white"
                    : "bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300"
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-sm text-stone-800 dark:text-stone-100 flex-1">
                {opt}
              </span>
              {submitted && isCorrect && (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              {submitted && isPicked && !isCorrect && (
                <XIcon className="w-4 h-4 text-rose-600 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {submitted && q.explanation && (
        <div className="text-xs px-3 py-2 bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-700 dark:text-stone-300 italic">
          {q.explanation}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleNext}
          disabled={!submitted}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 rounded-lg shadow-sm transition"
        >
          {idx === total - 1 ? "See results" : "Next question"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default QuizRunner;
