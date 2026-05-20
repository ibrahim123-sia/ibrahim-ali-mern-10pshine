import { useEffect, useRef, useState } from "react";
import {
  Mic,
  Square,
  Trash2,
  Play,
  Pause,
  Loader2,
  Wand2,
  BookOpen,
  AlertTriangle,
  Check,
} from "lucide-react";
import { useAppContext } from "../../context/context.jsx";

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const pickMimeType = () => {
  if (typeof window === "undefined" || !window.MediaRecorder) return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported?.(t)) return t;
  }
  return "";
};

const ModePill = ({ active, onClick, icon, label, hint }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 flex items-start gap-2 p-2.5 text-left rounded-lg border transition ${
      active
        ? "bg-amber-50 dark:bg-amber-900/30 border-amber-400 dark:border-amber-700"
        : "bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-amber-300"
    }`}
  >
    <span
      className={`mt-0.5 ${
        active ? "text-amber-600 dark:text-amber-300" : "text-stone-400"
      }`}
    >
      {icon}
    </span>
    <span className="flex-1">
      <span
        className={`block text-sm font-medium ${
          active
            ? "text-amber-900 dark:text-amber-200"
            : "text-stone-700 dark:text-stone-200"
        }`}
      >
        {label}
      </span>
      <span className="block text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
        {hint}
      </span>
    </span>
  </button>
);

const VoiceRecorder = ({ onResult, onCancel }) => {
  const { transcribeAudio } = useAppContext();
  const [phase, setPhase] = useState("idle"); // idle | recording | recorded | transcribing | done | error
  const [mode, setMode] = useState("cleanup"); // cleanup | summary
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [playing, setPlaying] = useState(false);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const audioElRef = useRef(null);

  useEffect(() => {
    return () => {
      cleanup();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state === "recording") {
      try {
        recorderRef.current.stop();
      } catch {
        /* ignored */
      }
    }
    recorderRef.current = null;
  };

  const startRecording = async () => {
    setError(null);
    setPermissionDenied(false);
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("Your browser doesn't support audio recording.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mt = pickMimeType();
      const rec = mt ? new MediaRecorder(stream, { mimeType: mt }) : new MediaRecorder(stream);
      recorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const finalType = rec.mimeType || mt || "audio/webm";
        const b = new Blob(chunksRef.current, { type: finalType });
        setBlob(b);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(b));
        setPhase("recorded");
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };
      rec.start();
      setPhase("recording");
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch (err) {
      if (err?.name === "NotAllowedError") {
        setPermissionDenied(true);
        setError("Microphone permission was denied.");
      } else {
        setError(err?.message || "Couldn't start recording");
      }
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  };

  const discardRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setBlob(null);
    setAudioUrl("");
    setElapsed(0);
    setResult(null);
    setError(null);
    setPlaying(false);
    setPhase("idle");
  };

  const togglePlay = () => {
    const el = audioElRef.current;
    if (!el) return;
    if (el.paused) {
      el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  const handleTranscribe = async () => {
    if (!blob) return;
    setPhase("transcribing");
    setError(null);
    try {
      // Pick a sensible filename + ext from blob type
      const type = blob.type || "audio/webm";
      const ext = type.includes("mp4")
        ? "mp4"
        : type.includes("ogg")
        ? "ogg"
        : type.includes("wav")
        ? "wav"
        : "webm";
      const file = new File([blob], `voice-${Date.now()}.${ext}`, { type });
      const data = await transcribeAudio({ file, mode });
      setResult(data);
      setPhase("done");
    } catch (err) {
      setError(err?.message || "Transcription failed");
      setPhase("error");
    }
  };

  const handleUse = () => {
    if (!result) return;
    onResult?.(result);
  };

  const isLongRecording = elapsed > 90; // hint to use summary above 90s

  return (
    <div className="space-y-3 px-6 py-4 border-b border-stone-200/70 dark:border-stone-700/70 bg-gradient-to-br from-rose-50/40 to-white/0 dark:from-rose-900/10 dark:to-stone-900/0 animate-fade-in">
      <div className="flex items-center gap-2">
        <Mic className="w-4 h-4 text-rose-600" />
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300">
          Voice to text
        </span>
        {phase === "recording" && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            Recording {formatTime(elapsed)}
          </span>
        )}
        {phase === "recorded" && (
          <span className="ml-auto text-xs text-stone-500 dark:text-stone-400">
            Length {formatTime(elapsed)}
          </span>
        )}
      </div>

      {permissionDenied && (
        <div className="flex items-start gap-2 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            Microphone permission was denied. Allow it in your browser
            settings, then try again.
          </span>
        </div>
      )}

      {error && !permissionDenied && (
        <div className="flex items-start gap-2 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Mode selector */}
      {phase !== "done" && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-stone-600 dark:text-stone-400">
              What should we do with the recording?
            </span>
            {isLongRecording && mode === "cleanup" && (
              <button
                type="button"
                onClick={() => setMode("summary")}
                className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline"
              >
                Long recording — switch to Summary?
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <ModePill
              active={mode === "cleanup"}
              onClick={() => setMode("cleanup")}
              icon={<Wand2 className="w-4 h-4" />}
              label="Polish my voice note"
              hint="Fix grammar/spelling, keep the meaning. Good for short notes."
            />
            <ModePill
              active={mode === "summary"}
              onClick={() => setMode("summary")}
              icon={<BookOpen className="w-4 h-4" />}
              label="Summarize a lecture"
              hint="Extract key points + a short overview. Good for long recordings."
            />
          </div>
        </div>
      )}

      {/* Controls */}
      {phase === "idle" && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startRecording}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition"
          >
            <Mic className="w-4 h-4" /> Start recording
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-200"
          >
            Cancel
          </button>
        </div>
      )}

      {phase === "recording" && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-stone-700 hover:bg-stone-800 rounded-lg shadow-sm transition"
          >
            <Square className="w-4 h-4" /> Stop
          </button>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-rose-500 animate-pulse"
                style={{
                  height: `${8 + ((elapsed + i) % 4) * 4}px`,
                  animationDelay: `${i * 120}ms`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {phase === "recorded" && (
        <div className="space-y-2">
          <audio
            ref={audioElRef}
            src={audioUrl}
            onEnded={() => setPlaying(false)}
            className="hidden"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-lg transition"
            >
              {playing ? (
                <>
                  <Pause className="w-4 h-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Play preview
                </>
              )}
            </button>
            <button
              type="button"
              onClick={discardRecording}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" /> Discard
            </button>
            <button
              type="button"
              onClick={handleTranscribe}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition"
            >
              {mode === "cleanup" ? (
                <>
                  <Wand2 className="w-4 h-4" /> Transcribe & polish
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" /> Transcribe & summarize
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {phase === "transcribing" && (
        <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
          <Loader2 className="w-4 h-4 animate-spin" />
          {mode === "cleanup"
            ? "Transcribing and cleaning up your recording…"
            : "Transcribing and summarizing your recording…"}
        </div>
      )}

      {phase === "done" && result && (
        <div className="space-y-2">
          <div className="text-xs text-stone-500 dark:text-stone-400">
            {result.mode === "summary" ? "Summary" : "Cleaned text"}
          </div>
          <div className="px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg max-h-48 overflow-y-auto">
            <p className="text-sm text-stone-800 dark:text-stone-100 whitespace-pre-wrap leading-relaxed">
              {result.text}
            </p>
          </div>
          <details className="text-xs text-stone-500 dark:text-stone-400">
            <summary className="cursor-pointer hover:text-stone-700 dark:hover:text-stone-200">
              Show raw transcript
            </summary>
            <p className="mt-1 px-3 py-2 bg-stone-50 dark:bg-stone-900/40 rounded text-stone-700 dark:text-stone-300 whitespace-pre-wrap leading-relaxed">
              {result.transcript}
            </p>
          </details>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={discardRecording}
              className="px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition"
            >
              Re-record
            </button>
            <button
              type="button"
              onClick={handleUse}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition"
            >
              <Check className="w-3.5 h-3.5" /> Insert into note
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
