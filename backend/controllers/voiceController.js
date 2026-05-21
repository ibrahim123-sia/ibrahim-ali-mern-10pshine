import fs from "node:fs";
import path from "node:path";
import { chatCompletion } from "../configs/groq.js";
import logger from "../configs/logger.js";

const GROQ_TRANSCRIBE_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const WHISPER_MODEL = "whisper-large-v3";
const VALID_MODES = new Set(["cleanup", "summary", "raw"]);

const removeFile = (p) => {
  if (!p) return;
  fs.unlink(p, () => {
    /* best effort */
  });
};

const transcribeWithGroq = async (filePath, mimetype) => {
  const apiKey = process.env.GROQ_API;
  if (!apiKey) {
    const err = new Error("GROQ_API key is not configured on the server");
    err.status = 503;
    throw err;
  }
  const buffer = await fs.promises.readFile(filePath);
  const blob = new Blob([buffer], { type: mimetype || "audio/webm" });
  const form = new FormData();
  form.append("file", blob, path.basename(filePath));
  form.append("model", WHISPER_MODEL);
  form.append("response_format", "json");
  form.append("temperature", "0");

  const res = await fetch(GROQ_TRANSCRIBE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    logger.error({ status: res.status, body: text }, "groq transcribe failed");
    const err = new Error(
      res.status === 401
        ? "AI service rejected the credentials"
        : `Transcription failed (${res.status})`
    );
    err.status = res.status === 401 ? 503 : 502;
    throw err;
  }
  const data = await res.json();
  return (data?.text || "").trim();
};

export const transcribe = async (req, res) => {
  let savedPath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No audio file uploaded" });
    }
    savedPath = req.file.path;

    const rawMode = String(req.body?.mode || "cleanup").toLowerCase();
    const mode = VALID_MODES.has(rawMode) ? rawMode : "cleanup";

    // 1. Transcribe with Whisper
    const transcript = await transcribeWithGroq(savedPath, req.file.mimetype);
    if (!transcript) {
      return res.status(422).json({
        message: "We couldn't hear anything in the recording. Try again?",
      });
    }

    // 2. Post-process (or skip if raw)
    let cleanedText = transcript;
    if (mode === "cleanup") {
      cleanedText = await chatCompletion({
        system:
          "You are a careful copy editor. Take the raw voice-to-text transcript and rewrite it with correct spelling, grammar, and punctuation. Preserve the speaker's voice, meaning, and the order of ideas. Do NOT summarize or add information. Respond with ONLY the cleaned text — no preamble.",
        user: transcript,
        temperature: 0.2,
        maxTokens: 1500,
      });
    } else if (mode === "summary") {
      cleanedText = await chatCompletion({
        system:
          "You summarize lecture or long voice transcripts into clean study notes. Output structured plain text:\n\n1) A 1-2 sentence overview.\n2) A bulleted list (using '- ') of the key points and any concrete details (definitions, formulas, names, dates).\n\nKeep it tight and accurate. Respond with ONLY the notes — no preamble.",
        user: transcript,
        temperature: 0.3,
        maxTokens: 1500,
      });
    }

    // Audio URL relative to the server's /uploads static mount
    const audioUrl = `/uploads/voice/${path.basename(savedPath)}`;
    return res.json({
      audioUrl,
      transcript,
      text: cleanedText.trim(),
      mode,
    });
  } catch (error) {
    // Clean up the audio if anything in the AI step blew up — we don't
    // want orphaned files for failed requests
    if (savedPath && (error.status === 502 || error.status === 503)) {
      removeFile(savedPath);
    }
    logger.error(
      { err: error, userId: req.user?._id?.toString() },
      "voice transcribe failed"
    );
    return res
      .status(error.status || 500)
      .json({ message: error.message || "Transcription failed" });
  }
};
