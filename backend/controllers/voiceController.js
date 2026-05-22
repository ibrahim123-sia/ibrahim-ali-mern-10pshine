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
  form.append("response_format", "verbose_json");
  form.append("temperature", "0");
  form.append("language", "en");

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
  return {
    text: (data?.text || "").trim(),
    duration: typeof data?.duration === "number" ? data.duration : 0,
  };
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

    // 1. Transcribe with Whisper (forced to English)
    const { text: transcript } = await transcribeWithGroq(
      savedPath,
      req.file.mimetype
    );
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
          "You are a strict transcription cleaner. Your ONLY job is to rewrite a raw English voice-to-text transcript with correct spelling, grammar, and punctuation.\n\n" +
          "Hard rules:\n" +
          "- Output in English only. If the transcript contains any non-English words or scripts, translate them into natural English. Never output any other language or script.\n" +
          "- Output ONLY the cleaned transcript. No preamble, no greeting, no sign-off, no notes, no commentary, no headings, no quotes around the text, no \"Here is...\".\n" +
          "- Do NOT add any information, opinions, examples, explanations, or context that is not literally in the transcript.\n" +
          "- Do NOT summarize, shorten, expand, rephrase for style, or change the order of ideas.\n" +
          "- Keep every word the speaker said. Only fix obvious filler (\"um\", \"uh\"), repeated words, and punctuation/capitalization.\n" +
          "- If the transcript is a single sentence, output a single sentence. If it is one short phrase, output one short phrase.\n" +
          "- Never invent a new paragraph, bullet list, or section that wasn't spoken.",
        user: transcript,
        temperature: 0,
        maxTokens: 1500,
      });
    } else if (mode === "summary") {
      cleanedText = await chatCompletion({
        system:
          "You summarize an English voice/lecture transcript into clean study notes.\n\n" +
          "Hard rules:\n" +
          "- Output in English only. Never use any other language or script.\n" +
          "- Output ONLY the notes. No preamble, no \"Here is the summary\", no sign-off.\n" +
          "- Use ONLY information that is literally in the transcript. Do not invent facts, examples, or context.\n" +
          "- Cover EVERY distinct point the speaker made — do not drop topics even if the recording is long.\n\n" +
          "Format (plain text, no markdown headings):\n" +
          "1) A 1-2 sentence overview of what the recording is about.\n" +
          "2) A blank line, then a bulleted list (using '- ') of every key point, in the order the speaker said them. Include concrete details (definitions, names, numbers, dates, formulas) verbatim.",
        user: transcript,
        temperature: 0.2,
        maxTokens: 2000,
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
