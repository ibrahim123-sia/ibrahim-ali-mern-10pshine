import { useEffect, useState } from "react";
import {
  X,
  Sparkles,
  Loader2,
  AlertTriangle,
  Layers,
  ListChecks,
  RotateCw,
} from "lucide-react";
import { useAppContext } from "../../context/context.jsx";
import { stripHtml } from "../../utils/formatTime.js";
import FlashcardDeck from "./FlashcardDeck.jsx";
import QuizRunner from "./QuizRunner.jsx";

const FLASHCARD_COUNT = 8;
const QUIZ_COUNT = 5;

const StudyModeModal = ({ open, note, onClose }) => {
  const { generateFlashcards, generateQuiz } = useAppContext();
  // State is reset via the `key` prop on the call site, which remounts
  // this component for each new note — no setState-in-effect needed.
  const [mode, setMode] = useState("flashcards"); // flashcards | quiz
  const [phase, setPhase] = useState("intro"); // intro | loading | ready | error
  const [cards, setCards] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !note) return null;

  const plainContent = stripHtml(note.content || "");
  const tooShort = plainContent.length < 60;

  const start = async () => {
    if (tooShort) return;
    setPhase("loading");
    setError(null);
    try {
      if (mode === "flashcards") {
        const data = await generateFlashcards({
          content: note.content || "",
          title: note.title || "",
          count: FLASHCARD_COUNT,
        });
        setCards(data?.cards || []);
        setPhase("ready");
      } else {
        const data = await generateQuiz({
          content: note.content || "",
          title: note.title || "",
          count: QUIZ_COUNT,
        });
        setQuestions(data?.questions || []);
        setPhase("ready");
      }
    } catch (err) {
      setError(err?.message || "Generation failed");
      setPhase("error");
    }
  };

  const restart = () => start();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-stone-800 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                AI Study Mode
              </h2>
              <div className="text-sm text-stone-700 dark:text-stone-200 truncate">
                {note.title || "Untitled"}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-700"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        {/* Mode tabs (only visible in intro / loading) */}
        {(phase === "intro" || phase === "loading" || phase === "error") && (
          <div className="px-6 pt-4">
            <div className="flex gap-1 bg-stone-100 dark:bg-stone-900 rounded-lg p-0.5">
              <TabButton
                active={mode === "flashcards"}
                onClick={() => setMode("flashcards")}
                icon={<Layers className="w-4 h-4" />}
                label="Flashcards"
              />
              <TabButton
                active={mode === "quiz"}
                onClick={() => setMode("quiz")}
                icon={<ListChecks className="w-4 h-4" />}
                label="Quiz"
              />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {phase === "intro" && (
            <div className="space-y-4">
              <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                {mode === "flashcards" ? (
                  <>
                    Generate <strong>{FLASHCARD_COUNT} flashcards</strong> from this
                    note. Tap a card to flip it, then mark whether you knew the answer.
                  </>
                ) : (
                  <>
                    Generate a <strong>{QUIZ_COUNT}-question multiple-choice quiz</strong>{" "}
                    from this note. You'll see explanations after answering.
                  </>
                )}
              </p>
              {tooShort && (
                <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    This note is too short to generate good study material. Add a bit
                    more content first.
                  </span>
                </div>
              )}
              <div className="flex justify-end">
                <button
                  onClick={start}
                  disabled={tooShort}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 rounded-lg shadow-sm transition"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate {mode === "flashcards" ? "flashcards" : "quiz"}
                </button>
              </div>
            </div>
          )}

          {phase === "loading" && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-stone-600 dark:text-stone-300">
              <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
              <p className="text-sm">
                {mode === "flashcards"
                  ? "Drafting flashcards from your note…"
                  : "Building your quiz…"}
              </p>
            </div>
          )}

          {phase === "error" && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={start}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg transition"
                >
                  <RotateCw className="w-4 h-4" /> Try again
                </button>
              </div>
            </div>
          )}

          {phase === "ready" && mode === "flashcards" && (
            <FlashcardDeck
              cards={cards}
              onRestart={restart}
              onClose={onClose}
            />
          )}

          {phase === "ready" && mode === "quiz" && (
            <QuizRunner
              questions={questions}
              onRestart={restart}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-sm rounded-md transition ${
      active
        ? "bg-white dark:bg-stone-700 shadow-sm text-amber-700 dark:text-amber-400 font-medium"
        : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
    }`}
  >
    {icon}
    {label}
  </button>
);

export default StudyModeModal;
